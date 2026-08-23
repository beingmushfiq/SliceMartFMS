# DATABASE DESIGN

> **Status:** Canonical. Precedence rank 4 (see `DECISIONS.md` §0).
>
> **Last updated:** 2026-08-22 · **Phase:** 0 (Architecture & Documentation)

The authoritative data model. Columns listed are the **required** ones; a
migration may add more, but may not omit or rename these. Table names are final.

---

## 1. Universal conventions

Every rule here applies to every table unless explicitly exempted.

| Rule | Detail |
|---|---|
| **Primary key** | `id` — `BIGINT UNSIGNED AUTO_INCREMENT` |
| **Public identifier** | `uuid` — `CHAR(36)`, unique, used in URLs and API payloads so internal IDs are never exposed |
| **Tenant column** | `tenant_id` — `BIGINT UNSIGNED NOT NULL`, **first column after `id`**, indexed, FK to `tenants` (ADR-004) |
| **Timestamps** | `created_at`, `updated_at` |
| **Soft delete** | `deleted_at` on master data only. **Never** on ledgers, audit logs, or posted financial documents |
| **Actor columns** | `created_by`, `updated_by` — FK to `users`, nullable for system writes |
| **Money** | `DECIMAL(18,4)`. Never `FLOAT`. Never a string |
| **Quantity** | `DECIMAL(18,4)` — supports weight-based production (kg, g) and piece counts alike |
| **Percentage** | `DECIMAL(8,4)` |
| **Enums** | Stored as `VARCHAR(32)`, validated by a PHP enum. **Never** a MySQL `ENUM` (migration cost) |
| **JSON** | `JSON` column, only for genuinely schemaless data (settings, snapshots, template definitions) |
| **Booleans** | `TINYINT(1)` with an explicit default |
| **Naming** | tables `snake_case` plural · columns `snake_case` · FK `<singular>_id` · pivots `<a>_<b>` alphabetical |

### 1.1 Tenant-scoped uniqueness (mandatory)

A code is unique **within a tenant**, never globally:

```sql
UNIQUE KEY uq_products_tenant_sku (tenant_id, sku)
UNIQUE KEY uq_invoices_tenant_number (tenant_id, company_id, invoice_number)
```

A unique key that omits `tenant_id` is a defect — it leaks tenant existence and
blocks onboarding.

> **Amendment (2026-08-23, found while implementing Waves 1–3).** **A unique key
> containing a nullable column cannot protect the rows where that column is
> NULL.** On MySQL 8 and SQLite alike `NULL != NULL`, so such a key admits
> unlimited duplicates among NULL rows. This cuts both ways and the distinction
> must be deliberate in every case:
>
> - **Used on purpose** to mean "at most one per tenant": a generated column that
>   folds to `tenant_id` when a flag is set and to NULL otherwise gives
>   `companies` exactly one default company per tenant, with no restriction on the
>   others (`companies.default_key`, `branches.default_key`).
> - **A defect** wherever the nullable column is `tenant_id` itself and NULL
>   carries meaning. `(tenant_id, email)` on `users` does not stop two *platform*
>   users sharing an address — an authentication defect, not a data-quality one —
>   and `(tenant_id, slug)` on `roles` does not stop two platform role templates
>   sharing a slug, which would make `CreateTenant` (§17.2) copy an arbitrary one.
>
> The fix is a read-only **generated sentinel column** that folds NULL to a value
> that does collide, with the unique key declared over the sentinel:
> `tenant_key = coalesce(tenant_id, 0)`. Platform rows then share one namespace
> and the key fires. `STORED` is the idiom inside `CREATE TABLE`; `VIRTUAL` is
> required where an `ALTER` adds it, because SQLite rejects
> `ADD COLUMN ... STORED` outright — see §16.1 rule 1. Both are indexable on
> MySQL 8 and SQLite, and both are unwritable, so an Action cannot desynchronise
> the sentinel from its source column.
>
> A sentinel solves **uniqueness only**. It cannot carry a foreign key on MySQL 8,
> which is why the parallel problem in §1.3 has no schema fix.

### 1.2 Index policy

- Every FK is indexed.
- Every list screen's default filter + sort has a composite index led by
  `tenant_id`.
- Ledger tables index `(tenant_id, product_id, warehouse_id, moved_at)`.
- Reporting date ranges index `(tenant_id, <date_column>)`.
- Polymorphic pairs index `(tenant_id, <x>_type, <x>_id)`.

### 1.3 Referential integrity

Foreign keys are declared with `RESTRICT` by default. `CASCADE` is permitted only
for a child that has no independent meaning (document lines, pivot rows,
attachments). `SET NULL` is permitted only where the column is genuinely
optional. Deletion of a referenced master record is prevented — records are
deactivated, not deleted.

Every reference to a tenant-scoped parent is a **composite** foreign key on
`(tenant_id, <parent>_id)` targeting the parent's `unique (tenant_id, id)`. A
single-column key only proves the parent row exists, not that it belongs to the
caller's tenant, which would reduce ARCHITECTURE §3.1 layer 4 from a database
guarantee to an application convention.

> **Correction (2026-08-23, found while implementing Wave 2).** **No composite
> foreign key led by `tenant_id` may use `ON DELETE SET NULL`**, even where the
> child column is nullable and the rule above would otherwise permit it.
> `SET NULL` nulls *every* column of the referencing key, so on
> `(tenant_id, branch_id)` it also attempts to null `tenant_id`, which is
> `NOT NULL`. The DDL migrates without complaint and the defect only appears at
> runtime: deleting a referenced parent fails with
> `NOT NULL constraint failed: factories.tenant_id`, an error naming the wrong
> table at an unrelated call site, instead of either a clean detach or a clean
> rejection. Verified on SQLite and structurally identical on MySQL 8. Use
> `RESTRICT`, which is the correct semantic here anyway — the sentence above
> already forbids hard-deleting referenced master data, so the detach path this
> was meant to enable does not exist. Where a genuine detach *is* required, an
> Action clears the child column inside the transaction before the parent is
> deactivated. Pinned by
> `Wave2OrgSchemaTest::test_deleting_a_referenced_branch_is_refused_cleanly`,
> which distinguishes the two failure modes rather than merely asserting the
> delete threw.

> **Amendment (2026-08-23, found while implementing Wave 3).** **A composite
> foreign key is not checked at all when any of its columns is NULL.** This is
> MATCH SIMPLE, the only matching mode MySQL 8 and SQLite implement, and it means
> a nullable `tenant_id` on a child table silently switches layer 4 off for
> exactly those rows. Consequences, in order of severity:
>
> - Where the NULL means "no parent", this is correct and desirable — a Wave 2
>   factory with `branch_id IS NULL` sits under no branch and no check is owed.
> - Where the NULL means "platform", the guarantee is **lost on the rows that
>   matter most**. `role_user.tenant_id` must be nullable so a platform user can
>   hold a platform role (ARCHITECTURE §3.2), and on those rows neither
>   `(tenant_id, role_id)` nor `(tenant_id, user_id)` is evaluated, so the
>   database will accept a platform grant pointing at an ordinary tenant user.
>
> **No schema fix exists.** A CHECK spanning three tables is not expressible, a
> trigger is unavailable on SQLite via `ALTER`, and MySQL 8 rejects a foreign key
> on a virtual generated column, which rules out the sentinel technique §1.1 uses
> for uniqueness. Therefore:
>
> 1. Prefer `tenant_id NOT NULL` on any table whose rows *grant* something, so
>    the composite key is always evaluated. `user_scopes` does this deliberately,
>    which is why a platform user cannot be given a scope row at all.
> 2. Where nullability is forced, the obligation moves up one layer: the Action
>    performing the write asserts both sides are platform, inside the
>    transaction, before the insert. This is the one documented case where the
>    database is not the last line of defence.
> 3. The gap is pinned by a test that asserts the **hole**, not a guarantee —
>    `Wave3IdentitySchemaTest::test_a_platform_role_assignment_is_not_checked_by_the_database`
>    — so a later reader cannot mistake the composite keys for protection they do
>    not provide on NULL-tenant rows.

### 1.4 Document numbering

Every business document has a human-readable number generated server-side from a
**tenant-configurable series** (prefix, padding, reset period, scope). Numbers
are allocated inside the creating transaction from a `document_sequences` row
locked `FOR UPDATE`, so gaps and duplicates cannot occur. Scope resolution is
**open question Q3** and blocks Phase 5.

---

## 2. Group A — Platform & tenancy

### `tenants`
Exempt from `tenant_id` (it *is* the tenant).

| Column | Type | Notes |
|---|---|---|
| `id`, `uuid` | | |
| `name` | varchar(191) | |
| `slug` | varchar(64) | unique, used for subdomain/routing |
| `plan_id` | FK `plans` | |
| `status` | varchar(32) | `trial` `active` `past_due` `suspended` `cancelled` |
| `trial_ends_at`, `activated_at`, `suspended_at` | timestamp | nullable |
| `locale` | varchar(10) | default `en` |
| `timezone` | varchar(64) | |
| `currency_code` | char(3) | tenant setting, never a constant (ADR-002) |
| `date_format`, `number_format` | varchar(32) | |
| `settings` | json | feature toggles, workflow options, terminology overrides |
| `branding` | json | logo path, whitelisted semantic token overrides (ADR-020) |

### `plans`
Platform-owned. `code`, `name`, `price`, `billing_period`, `limits` (json:
users, warehouses, monthly documents, storage), `features` (json), `is_active`.

### `tenant_subscriptions`
`tenant_id`, `plan_id`, `starts_at`, `ends_at`, `status`, `amount`,
`external_reference`.

### `tenant_usage_counters`
`tenant_id`, `metric`, `period`, `value`. Enforces plan quotas without scanning
whole tables. Unique `(tenant_id, metric, period)`.

### `companies`
`tenant_id`, `name`, `legal_name`, `tax_identifier`, `registration_number`,
`address`, `phone`, `email`, `logo_path`, `is_default`, `is_active`.
Unique `(tenant_id, name)`.

### `branches`
`tenant_id`, `company_id`, `code`, `name`, `type` (`sales` `warehouse`
`factory` `mixed`), `address`, `phone`, `is_default`, `is_active`.
Unique `(tenant_id, code)`.

### `factories`
`tenant_id`, `company_id`, `branch_id` (nullable), `code`, `name`, `address`,
`is_active`. Unique `(tenant_id, code)`.

### `production_lines`
`tenant_id`, `factory_id`, `code`, `name`, `capacity_per_shift`,
`capacity_unit_id`, `is_active`. Unique `(tenant_id, factory_id, code)`.
**This table is why Generation A's "1 production line" is dead** (C4).

---

## 3. Group B — Identity, access & audit

### `users`
`tenant_id` **nullable** — `NULL` marks a platform user.

| Column | Notes |
|---|---|
| `name`, `email`, `phone` | `email` unique `(tenant_id, email)` |
| `password` | argon2/bcrypt hash |
| `email_verified_at`, `last_login_at`, `last_login_ip` | |
| `is_platform_user` | tinyint, mutually consistent with `tenant_id IS NULL` |
| `status` | `active` `invited` `suspended` |
| `locale` | overrides tenant locale |
| `perm_version` | int, incremented on any role/scope change (ADR-007) |
| `two_factor_secret`, `two_factor_confirmed_at` | nullable, Phase 10 |

### `roles`
`tenant_id` (nullable for platform templates), `name`, `slug`, `description`,
`is_system` (system roles cannot be deleted), `level` (ordering for UI).
Unique `(tenant_id, slug)`.

### `permissions`
Global catalogue, **no `tenant_id`**. `name` (`module.resource.action`),
`module`, `resource`, `action`, `description`. Unique `name`. Seeded from code
so the registry cannot drift (ADR-008).

### `role_permission`
`role_id`, `permission_id`. Primary key on both.

### `role_user`
`tenant_id`, `role_id`, `user_id`. Unique `(role_id, user_id)`.

### `user_scopes`
Which slice of the hierarchy a user may act in (ARCHITECTURE §3.3).

`tenant_id`, `user_id`, `scope_type` (`company` `branch` `factory`
`production_line` `warehouse`), `scope_id`. Unique
`(user_id, scope_type, scope_id)`. **No rows = access to the whole tenant**,
subject to permissions.

### `refresh_tokens`
`tenant_id` (nullable), `user_id`, `family_id` (uuid), `token_hash`,
`expires_at`, `revoked_at`, `replaced_by_id`, `user_agent`, `ip`.
Index `(user_id, family_id)`. Rotation and family invalidation per ADR-007.

### `audit_logs`
**Append-only. No `updated_at`, no `deleted_at`, no UPDATE, no DELETE.**
(ADR-027)

| Column | Notes |
|---|---|
| `tenant_id` | nullable for platform actions |
| `user_id` | nullable for system/queue actions |
| `action` | `created` `updated` `deleted` `approved` `voided` `locked` `exported` `logged_in` `permission_denied` … |
| `auditable_type`, `auditable_id` | polymorphic target |
| `before`, `after` | json snapshots, redacted by allow-list |
| `changed_fields` | json array, for cheap filtering |
| `context` | json: module, route, reason text |
| `ip`, `user_agent`, `correlation_id` | |
| `created_at` | |

Index `(tenant_id, auditable_type, auditable_id)`, `(tenant_id, created_at)`,
`(tenant_id, user_id, created_at)`.

Both foreign keys are `RESTRICT`. §1.3 permits `CASCADE` for a child with no
independent meaning, and an audit row can be mistaken for one — it is the
opposite: it is the only row that outlives its subject. The consequence is a
product constraint, not just a schema one: **a user who has done anything can
never be hard-deleted, and neither can their tenant.** Offboarding is an
explicit archive-then-purge Action, never a `DELETE`.

### `idempotency_keys`
`tenant_id`, `user_id`, `key`, `endpoint`, `request_hash`, `response_status`,
`response_body` (json), `expires_at`. Unique
`(tenant_id, user_id, endpoint, key)`. Purged after 24 h (ADR-028).

> **Correction (2026-08-23, found while implementing Wave 4).** This section
> previously specified unique `(tenant_id, key)`, which contradicts
> API_CONTRACT §6.2's scope of `(tenant_id, user_id, route, key)`. Both documents
> are precedence rank 4, so per README §2 the tie is a rank-1 problem; it is
> resolved here in favour of §6.2 because the narrow key is not merely stricter,
> it is **unsafe**: two users of one tenant who generate the same UUID would
> share a row, and §6.3's replay rule would return one user's stored response
> body to the other. `user_id` is therefore NOT NULL on this table — an
> idempotency row always belongs to the actor whose intent it de-duplicates.
> Pinned by `Wave4InfraSchemaTest::test_one_idempotency_key_may_be_reused_across_routes_and_users`,
> which fails closed if the key is ever narrowed back.

### `attachments`
`tenant_id`, `attachable_type`, `attachable_id`, `disk`, `path`,
`original_name`, `mime_type`, `size_bytes`, `checksum`, `uploaded_by`.
Index `(tenant_id, attachable_type, attachable_id)`.

### `notifications`
`tenant_id`, `user_id`, `type`, `channel` (`in_app` `email` `sms` `push`),
`title_key`, `body_key`, `params` (json — translated client-side, ADR-018),
`action_url`, `severity`, `read_at`, `sent_at`, `failed_at`, `error`.

### `notification_preferences`
`tenant_id`, `user_id`, `type`, `channel`, `enabled`.

---

## 4. Group C — Master data

### `units`
`tenant_id`, `code`, `name`, `type` (`weight` `volume` `length` `piece`
`time`), `is_base`, `precision`. Unique `(tenant_id, code)`.

### `unit_conversions`
`tenant_id`, `from_unit_id`, `to_unit_id`, `factor` decimal(18,8).
Unique `(tenant_id, from_unit_id, to_unit_id)`. Conversion is data, never a
hardcoded multiplier.

### `categories`
`tenant_id`, `parent_id` (self FK, nullable), `code`, `name`, `path` (materialised
ancestor path for cheap subtree queries), `is_active`.

### `brands`
`tenant_id`, `code`, `name`, `logo_path`, `is_active`.

### `products`
The **single central catalogue** for production, purchasing, sales, POS and
e-commerce (ADR-016).

| Column | Notes |
|---|---|
| `tenant_id`, `uuid` | |
| `sku` | unique `(tenant_id, sku)` |
| `barcode` | nullable, unique `(tenant_id, barcode)` |
| `name`, `description` | |
| `type` | `raw_material` `semi_finished` `finished` `packaging` `consumable` `service` `asset_part` |
| `category_id`, `brand_id` | nullable |
| `base_unit_id` | FK `units` |
| `purchase_unit_id`, `sales_unit_id` | nullable, converted via `unit_conversions` |
| `is_produced`, `is_purchased`, `is_sold`, `is_stock_tracked` | tinyint capability flags |
| `has_variants` | tinyint |
| `tracking_mode` | `none` `batch` `serial` `batch_and_serial` |
| `shelf_life_days` | nullable |
| `reorder_level`, `reorder_quantity` | nullable |
| `standard_cost`, `default_sale_price` | decimal(18,4) |
| `tax_profile_id` | nullable |
| `weight`, `dimensions` | nullable — required by courier rate calls |
| `is_online`, `online_slug`, `online_meta` | e-commerce exposure (Phase 9) |
| `status` | `active` `discontinued` `draft` |

### `product_variants`
`tenant_id`, `product_id`, `sku`, `barcode`, `attributes` (json),
`price_delta`, `is_active`. Unique `(tenant_id, sku)`.

### `product_images`
`tenant_id`, `product_id`, `variant_id` (nullable), `path`, `alt_key`,
`sort_order`, `is_primary`.

### `bill_of_materials`
`tenant_id`, `product_id` (output), `version`, `name`, `output_quantity`,
`output_unit_id`, `expected_yield_percentage`, `status` (`draft` `active`
`archived`), `effective_from`, `effective_to`.
Unique `(tenant_id, product_id, version)`. **Versioned** so a historical batch
still resolves the recipe it actually used.

### `bill_of_material_items`
`tenant_id`, `bill_of_material_id`, `product_id` (input), `quantity`,
`unit_id`, `wastage_allowance_percentage`, `is_optional`, `sort_order`.

### `warehouses`
`tenant_id`, `company_id`, `branch_id` (nullable), `factory_id` (nullable),
`code`, `name`, `type` (`raw_material` `finished_goods` `packaging`
`quarantine` `scrap` `transit` `general`), `address`, `is_default`,
`allows_negative_stock` (tinyint, default 0), `is_active`.
Unique `(tenant_id, code)`. **Count is unlimited** (C4).

### `warehouse_locations`
`tenant_id`, `warehouse_id`, `parent_id` (nullable — zone → rack → bin),
`code`, `name`, `type`, `is_active`. Unique `(tenant_id, warehouse_id, code)`.

### `parties`
One row may be supplier *and* customer (`PROJECT_CONTEXT` §5.2).

`tenant_id`, `code`, `name`, `legal_name`, `is_supplier`, `is_customer`,
`is_dealer`, `is_agent`, `type` (`individual` `business`), `tax_identifier`,
`phone`, `email`, `credit_limit`, `credit_days`, `price_list_id`,
`tax_profile_id`, `opening_balance`, `current_balance` (cache),
`assigned_to` (FK users), `status`. Unique `(tenant_id, code)`.

### `party_addresses`
`tenant_id`, `party_id`, `label`, `type` (`billing` `shipping`),
`contact_name`, `phone`, `line1`, `line2`, `area`, `city`, `district`,
`postal_code`, `country_code`, `latitude`, `longitude`, `is_default`.
Courier integrations require the structured fields — a single free-text address
blocks Phase 6.

### `party_contacts`
`tenant_id`, `party_id`, `name`, `designation`, `phone`, `email`, `is_primary`.

### `price_lists`
`tenant_id`, `code`, `name`, `currency_code`, `applies_to` (`all`
`customer_group` `channel`), `channel` (nullable), `priority`,
`valid_from`, `valid_to`, `is_active`.

### `price_list_items`
`tenant_id`, `price_list_id`, `product_id`, `variant_id` (nullable),
`min_quantity`, `unit_price`, `discount_percentage`.
Unique `(tenant_id, price_list_id, product_id, variant_id, min_quantity)`.

### `tax_profiles`
`tenant_id`, `code`, `name`, `rate`, `type` (`inclusive` `exclusive`),
`is_compound`, `is_active`. Model choice is **open question Q2**, blocking
Phase 5.

### `discount_rules`
`tenant_id`, `name`, `scope` (`product` `category` `party` `order`),
`scope_id`, `condition` (json), `discount_type` (`percentage` `fixed`),
`value`, `valid_from`, `valid_to`, `priority`, `is_active`.

### `document_sequences`
`tenant_id`, `company_id` (nullable), `branch_id` (nullable),
`document_type`, `prefix`, `suffix`, `padding`, `next_number`,
`reset_period` (`never` `yearly` `monthly`), `last_reset_at`.
Unique `(tenant_id, company_key, branch_key, document_type)` over the §1.1
sentinels. Locked `FOR UPDATE` during allocation (§1.4).

> **Correction (2026-08-23, found while implementing Wave 4).** The key was
> specified over `company_id` and `branch_id` directly, which §1.1 shows cannot
> fire: both are nullable, and the tenant-wide series that Q3 leaves on the table
> is exactly the `(NULL, NULL)` row. A tenant could hold unlimited tenant-wide
> series for one `document_type`, and §1.4's `FOR UPDATE` lock would then be
> taken on an arbitrary one of them — duplicate document numbers on posted
> financial documents. The stored generated sentinels
> `company_key = coalesce(company_id, 0)` and `branch_key = coalesce(branch_id, 0)`
> fold the NULLs into one namespace so the key fires on every row; the semantic
> columns stay nullable and keep carrying the FKs, which the sentinels cannot
> (§1.1). Those FKs are `RESTRICT`, not `SET NULL`, per §1.3's composite-key
> amendment.

---

## 5. Group D — Production

This group implements ADR-011, ADR-012 and ADR-013. It is the reason the legacy
schema had to be replaced: there was no batch, no worker linkage, no QC chain
and no wastage table (C11, C12, C13).

### `production_plans`
`tenant_id`, `company_id`, `factory_id`, `plan_number`, `plan_date`,
`period_start`, `period_end`, `source` (`manual` `sales_order` `forecast`
`reorder`), `status` (`draft` `approved` `in_progress` `completed`
`cancelled`), `notes`, `approved_by`, `approved_at`.
Unique `(tenant_id, plan_number)`.

### `production_plan_items`
`tenant_id`, `production_plan_id`, `product_id`, `bill_of_material_id`,
`planned_quantity`, `unit_id`, `production_line_id` (nullable),
`scheduled_date`, `produced_quantity` (cache), `status`, `sort_order`.

### `production_batches`
The spine of the production chain.

| Column | Notes |
|---|---|
| `tenant_id`, `uuid` | |
| `batch_number` | unique `(tenant_id, batch_number)` |
| `production_plan_item_id` | nullable — unplanned batches are legal |
| `factory_id`, `production_line_id` | |
| `product_id`, `bill_of_material_id` | BoM version is frozen here |
| `shift_id` | nullable, FK `shifts` |
| `batch_date`, `started_at`, `completed_at` | |
| `planned_quantity`, `output_unit_id` | |
| `status` | `draft` `in_progress` `output_recorded` `in_qc` `completed` `cancelled` |
| `context_completeness` | `draft` `collecting` `context_complete` `analysed` `closed` — **ADR-012** |
| `total_input_quantity` | cache, from `production_batch_inputs` |
| `total_output_quantity` | cache, from `production_outputs` |
| `worker_reported_quantity` | cache, from `worker_production_entries` |
| `yield_percentage` | nullable — **NULL until `context_complete`** |
| `variance_quantity`, `variance_percentage` | nullable — same rule |
| `analysis` | json — computed variance breakdown, written once at analysis |
| `supervisor_id` | FK users |
| `closed_by`, `closed_at` | |

Index `(tenant_id, batch_date)`, `(tenant_id, status)`,
`(tenant_id, production_line_id, batch_date)`.

**Invariant:** `yield_percentage`, `variance_quantity` and
`variance_percentage` are `NULL` while `context_completeness` is `draft` or
`collecting`. The UI renders "Awaiting data" for `NULL`, never "Mismatch"
(ADR-012). A migration default of `0` on these columns is a defect.

### `production_batch_inputs`
What actually entered the line — recorded independently of material issue.

`tenant_id`, `production_batch_id`, `product_id`, `quantity`, `unit_id`,
`source` (`material_issue` `manual_count` `weighbridge` `carry_forward`),
`material_issue_item_id` (nullable), `recorded_by`, `recorded_at`, `notes`.

### `material_issues`
Warehouse-side document; posts to the stock ledger.

`tenant_id`, `issue_number`, `production_batch_id`, `warehouse_id`,
`issue_date`, `status` (`draft` `issued` `partially_returned` `returned`
`cancelled`), `issued_by`, `notes`. Unique `(tenant_id, issue_number)`.

### `material_issue_items`
`tenant_id`, `material_issue_id`, `product_id`, `requested_quantity`,
`issued_quantity`, `returned_quantity`, `unit_id`, `warehouse_location_id`
(nullable), `unit_cost`, `stock_movement_id` (nullable — the ledger row it
created).

### `worker_production_entries`
Many-to-many with batch, worker and product (ADR-013).

| Column | Notes |
|---|---|
| `tenant_id` | |
| `production_batch_id` | |
| `employee_id` | FK `employees` |
| `product_id` | what this worker produced |
| `production_line_id`, `shift_id` | |
| `work_date` | |
| `measure_type` | `piece` `weight` `volume` `unit` — **the same worker may be paid differently per product** |
| `quantity`, `unit_id` | |
| `rework_quantity`, `rejected_quantity` | |
| `hours_worked` | nullable |
| `rate_type` | `piece_rate` `hourly` `fixed` `none` |
| `rate`, `incentive_amount` | nullable — `NULL` until payroll resolves it (Q1) |
| `payroll_period_id` | nullable — set at payroll lock, then immutable |
| `entered_by`, `verified_by`, `verified_at` | |
| `status` | `draft` `submitted` `verified` `locked` |

Unique `(tenant_id, production_batch_id, employee_id, product_id, work_date, shift_id)`.
Index `(tenant_id, employee_id, work_date)` for payroll,
`(tenant_id, production_batch_id)` for reconciliation.

**Invariant:** once `payroll_period_id` is set, the row is immutable. Corrections
require a reversing entry, never an edit.

### `production_outputs`
`tenant_id`, `production_batch_id`, `product_id`, `variant_id` (nullable),
`quantity`, `unit_id`, `output_type` (`primary` `by_product` `semi_finished`),
`batch_code` (traceability lot), `expiry_date` (nullable),
`target_warehouse_id`, `qc_required` (tinyint), `qc_status` (`pending`
`passed` `failed` `partial` `not_required`), `stock_movement_id` (nullable —
set only after QC clears), `recorded_by`, `recorded_at`.

**Invariant:** output does **not** become available stock until QC passes when
`qc_required = 1`. Until then it is a `quarantine`-state ledger row (§6).

### `qc_inspections`
`tenant_id`, `inspection_number`, `production_batch_id`, `production_output_id`,
`inspection_date`, `inspector_id`, `sample_size`, `inspected_quantity`,
`passed_quantity`, `failed_quantity`, `rework_quantity`, `scrap_quantity`,
`result` (`pass` `fail` `partial` `hold`), `status` (`draft` `submitted`
`approved` `rejected`), `notes`, `approved_by`, `approved_at`.
Unique `(tenant_id, inspection_number)`.

**Invariant:**
`passed + failed = inspected_quantity` and
`failed = rework + scrap` (any remainder is a wastage row). Enforced in the
Action, asserted in tests.

### `qc_parameters`
Tenant-defined checklist. `tenant_id`, `product_id` (nullable — global when
NULL), `name`, `type` (`numeric` `boolean` `select` `text`), `unit_id`
(nullable), `min_value`, `max_value`, `options` (json), `is_mandatory`,
`sort_order`.

### `qc_inspection_results`
`tenant_id`, `qc_inspection_id`, `qc_parameter_id`, `value_numeric`,
`value_boolean`, `value_text`, `is_within_spec`, `notes`.

### `qc_defects`
`tenant_id`, `qc_inspection_id`, `defect_reason_id`, `quantity`, `severity`
(`minor` `major` `critical`), `notes`.

### `reason_codes`
One table for every mandatory-reason field in the system — QC defects, stock
adjustments, wastage causes, returns, cancellations.

`tenant_id`, `context` (`qc_defect` `wastage` `stock_adjustment`
`sales_return` `purchase_return` `cancellation` `rework`), `code`, `name`,
`requires_note` (tinyint), `is_active`, `sort_order`.
Unique `(tenant_id, context, code)`.

### `wastage_records`
`tenant_id`, `wastage_number`, `production_batch_id` (nullable), `product_id`,
`stage` (`input` `in_process` `output` `qc` `storage` `transit`),
`quantity`, `unit_id`, `reason_code_id`, `estimated_cost`, `is_recoverable`,
`recovered_quantity`, `warehouse_id` (nullable), `stock_movement_id`
(nullable), `recorded_by`, `recorded_at`, `notes`.
Unique `(tenant_id, wastage_number)`.

### `rework_orders`
`tenant_id`, `rework_number`, `source_batch_id`, `qc_inspection_id`,
`product_id`, `quantity`, `unit_id`, `target_batch_id` (nullable — the new
batch that consumes it), `cycle_number` (int, guards infinite rework),
`status` (`pending` `in_progress` `completed` `scrapped`), `cost_incurred`,
`notes`. Unique `(tenant_id, rework_number)`.

---

## 6. Group E — Inventory (the ledger)

Implements ADR-014. **`stock_movements` is the single source of truth for
quantity. `stock_balances` is a rebuildable cache.**

### `stock_movements`
**Append-only. Never updated. Never deleted.** A correction is a new,
opposite-signed row referencing the original.

| Column | Notes |
|---|---|
| `tenant_id`, `uuid` | |
| `movement_number` | unique `(tenant_id, movement_number)` |
| `product_id`, `variant_id` | |
| `warehouse_id`, `warehouse_location_id` | |
| `batch_code`, `serial_number`, `expiry_date` | nullable, per `products.tracking_mode` |
| `movement_type` | one of the 15 below |
| `direction` | `in` `out` — derived from type, stored for index efficiency |
| `stock_state` | one of the 5 below |
| `quantity` | **always positive**; `direction` carries the sign |
| `unit_id` | |
| `unit_cost`, `total_cost` | valuation at movement time |
| `balance_after` | running balance snapshot for audit replay |
| `reference_type`, `reference_id` | polymorphic source document |
| `related_movement_id` | nullable — pairs transfers and reversals |
| `reason_code_id` | nullable, **mandatory** for adjustment types |
| `moved_at` | business timestamp, may differ from `created_at` |
| `created_by`, `created_at` | |

Index `(tenant_id, product_id, warehouse_id, moved_at)`,
`(tenant_id, movement_type, moved_at)`,
`(tenant_id, reference_type, reference_id)`.

**The 15 movement types**

| # | Type | Direction | Raised by |
|---|---|---|---|
| 1 | `purchase_receipt` | in | GRN |
| 2 | `production_output` | in | production output after QC |
| 3 | `sales_return` | in | credit note with restock |
| 4 | `transfer_in` | in | transfer destination leg |
| 5 | `adjustment_increase` | in | stock adjustment (reason required) |
| 6 | `opening_stock` | in | initial load / migration |
| 7 | `rework_return` | in | rework order completion |
| 8 | `material_issue` | out | issue to a production batch |
| 9 | `sales_delivery` | out | invoice / POS sale |
| 10 | `purchase_return` | out | supplier return |
| 11 | `transfer_out` | out | transfer source leg |
| 12 | `adjustment_decrease` | out | stock adjustment (reason required) |
| 13 | `wastage` | out | wastage record |
| 14 | `scrap` | out | QC scrap disposition |
| 15 | `sample_issue` | out | free sample / marketing issue |

**The 5 stock states**

| State | Meaning | Sellable |
|---|---|---|
| `available` | free to use or sell | yes |
| `reserved` | committed to a confirmed order | no |
| `in_transit` | left source, not yet received | no |
| `quarantine` | awaiting QC decision | no |
| `damaged` | unusable, pending write-off | no |

**Invariants**

1. A transfer creates exactly two rows in one transaction (`transfer_out` +
   `transfer_in`), linked by `related_movement_id`.
2. `adjustment_increase` / `adjustment_decrease` / `wastage` / `scrap` require
   `reason_code_id`.
3. `balance_after` is computed under a row lock on the matching
   `stock_balances` row, so replay always reconciles.
4. Negative `available` stock is rejected unless
   `warehouses.allows_negative_stock = 1`.

### `stock_balances`
Transactional cache. Updated **in the same transaction** as the movement that
changes it. Rebuildable by replaying `stock_movements`.

`tenant_id`, `product_id`, `variant_id`, `warehouse_id`,
`warehouse_location_id`, `batch_code`, `stock_state`, `quantity`,
`average_cost`, `total_value`, `last_movement_id`, `last_movement_at`.
Unique `(tenant_id, product_id, variant_id, warehouse_id, warehouse_location_id, batch_code, stock_state)`.

A `UPDATE stock_balances SET quantity = ...` outside a movement transaction is a
defect (ADR-014).

### `stock_reservations`
Holds `reserved` state against a document without consuming it.

`tenant_id`, `product_id`, `variant_id`, `warehouse_id`, `quantity`,
`reference_type`, `reference_id`, `expires_at` (nullable — carts expire, orders
do not), `status` (`active` `consumed` `released` `expired`),
`created_by`.

### `stock_transfers`
`tenant_id`, `transfer_number`, `from_warehouse_id`, `to_warehouse_id`,
`transfer_date`, `status` (`draft` `in_transit` `partially_received`
`received` `cancelled`), `dispatched_by`, `dispatched_at`, `received_by`,
`received_at`, `notes`. Unique `(tenant_id, transfer_number)`.

### `stock_transfer_items`
`tenant_id`, `stock_transfer_id`, `product_id`, `variant_id`, `batch_code`,
`sent_quantity`, `received_quantity`, `damaged_quantity`, `unit_id`,
`out_movement_id`, `in_movement_id`.

### `stock_adjustments`
`tenant_id`, `adjustment_number`, `warehouse_id`, `adjustment_date`,
`type` (`increase` `decrease` `revaluation`), `reason_code_id`,
`status` (`draft` `pending_approval` `approved` `rejected`),
`total_value_impact`, `requested_by`, `approved_by`, `approved_at`,
`notes`. Unique `(tenant_id, adjustment_number)`. Approval requirement is
**open question Q6**, blocking Phase 4.

### `stock_adjustment_items`
`tenant_id`, `stock_adjustment_id`, `product_id`, `variant_id`, `batch_code`,
`system_quantity`, `adjusted_quantity`, `difference_quantity`, `unit_cost`,
`stock_movement_id`, `notes`.

### `stock_counts`
Physical count / cycle count session.

`tenant_id`, `count_number`, `warehouse_id`, `count_date`,
`type` (`full` `cycle` `spot`), `status` (`draft` `counting`
`review` `reconciled` `cancelled`), `freeze_stock` (tinyint),
`counted_by`, `reconciled_by`, `reconciled_at`,
`stock_adjustment_id` (nullable — the adjustment it generated).
Unique `(tenant_id, count_number)`.

### `stock_count_items`
`tenant_id`, `stock_count_id`, `product_id`, `variant_id`,
`warehouse_location_id`, `batch_code`, `system_quantity` (snapshot at
freeze), `counted_quantity`, `variance_quantity`, `recount_quantity`,
`status` (`pending` `counted` `variance` `accepted`), `counted_by`,
`counted_at`, `notes`.

**Invariant:** `system_quantity` is snapshotted when counting starts, so
concurrent movements do not corrupt the variance figure.

---

## 7. Group F — Purchasing

### `purchase_requisitions`
`tenant_id`, `requisition_number`, `branch_id`, `warehouse_id`,
`required_by_date`, `status` (`draft` `pending_approval` `approved`
`rejected` `partially_ordered` `ordered` `cancelled`), `requested_by`,
`approved_by`, `approved_at`, `rejection_reason`, `notes`.
Unique `(tenant_id, requisition_number)`.

### `purchase_requisition_items`
`tenant_id`, `purchase_requisition_id`, `product_id`, `quantity`, `unit_id`,
`ordered_quantity` (cache), `estimated_unit_cost`, `notes`, `sort_order`.

### `purchase_orders`
`tenant_id`, `po_number`, `party_id` (supplier), `company_id`, `branch_id`,
`warehouse_id`, `purchase_requisition_id` (nullable), `order_date`,
`expected_date`, `currency_code`, `subtotal`, `discount_amount`,
`tax_amount`, `shipping_amount`, `total_amount`, `received_value` (cache),
`billed_value` (cache), `payment_terms`, `status` (`draft`
`pending_approval` `approved` `sent` `partially_received` `received`
`closed` `cancelled`), `approved_by`, `approved_at`, `notes`, `terms`.
Unique `(tenant_id, po_number)`.

### `purchase_order_items`
`tenant_id`, `purchase_order_id`, `product_id`, `variant_id`, `description`,
`quantity`, `unit_id`, `unit_price`, `discount_percentage`,
`discount_amount`, `tax_profile_id`, `tax_amount`, `line_total`,
`received_quantity` (cache), `billed_quantity` (cache), `sort_order`.

### `goods_receipts`
`tenant_id`, `grn_number`, `purchase_order_id` (nullable — direct receipts are
legal), `party_id`, `warehouse_id`, `receipt_date`,
`supplier_document_number`, `status` (`draft` `received` `qc_pending`
`completed` `cancelled`), `received_by`, `notes`.
Unique `(tenant_id, grn_number)`.

### `goods_receipt_items`
`tenant_id`, `goods_receipt_id`, `purchase_order_item_id` (nullable),
`product_id`, `variant_id`, `ordered_quantity`, `received_quantity`,
`accepted_quantity`, `rejected_quantity`, `unit_id`, `unit_cost`,
`batch_code`, `expiry_date`, `warehouse_location_id`,
`stock_movement_id`, `reason_code_id` (nullable — required when rejecting).

**Invariant:** stock posts for `accepted_quantity` only; `rejected_quantity`
posts to `quarantine` or raises a supplier return.

### `purchase_bills`
`tenant_id`, `bill_number`, `supplier_bill_number`, `party_id`,
`purchase_order_id` (nullable), `goods_receipt_id` (nullable), `bill_date`,
`due_date`, `subtotal`, `discount_amount`, `tax_amount`, `other_charges`,
`total_amount`, `paid_amount` (cache), `status` (`draft` `posted`
`partially_paid` `paid` `cancelled`), `posted_by`, `posted_at`.
Unique `(tenant_id, bill_number)`.

**Invariant:** a posted bill is immutable. Corrections are debit/credit notes.

### `purchase_bill_items`
`tenant_id`, `purchase_bill_id`, `goods_receipt_item_id` (nullable),
`product_id`, `description`, `quantity`, `unit_id`, `unit_price`,
`tax_profile_id`, `tax_amount`, `line_total`, `expense_account_id`
(nullable).

### `purchase_returns`
`tenant_id`, `return_number`, `party_id`, `goods_receipt_id` (nullable),
`warehouse_id`, `return_date`, `reason_code_id`, `subtotal`, `tax_amount`,
`total_amount`, `status` (`draft` `posted` `credited` `cancelled`),
`debit_note_number`, `created_by`. Unique `(tenant_id, return_number)`.

### `purchase_return_items`
`tenant_id`, `purchase_return_id`, `product_id`, `variant_id`, `batch_code`,
`quantity`, `unit_id`, `unit_cost`, `line_total`, `stock_movement_id`.

---

## 8. Group G — Sales, POS and invoicing

Implements ADR-015 and ADR-016: **one sales core, discriminated by `channel`.**
There is no separate POS order table and no separate e-commerce order table.

### `sales_orders`

| Column | Notes |
|---|---|
| `tenant_id`, `uuid` | |
| `order_number` | unique `(tenant_id, order_number)` |
| `channel` | **`counter` `dealer` `phone` `field` `online`** — ADR-015 |
| `company_id`, `branch_id`, `warehouse_id` | |
| `party_id` | nullable for walk-in POS customers |
| `customer_name`, `customer_phone` | denormalised for walk-in sales |
| `pos_session_id` | nullable, FK `pos_sessions` |
| `order_date`, `required_date` | |
| `price_list_id`, `currency_code` | |
| `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `round_off`, `total_amount` | |
| `paid_amount`, `due_amount` | caches |
| `delivery_type` | `pickup` `own_delivery` `courier` |
| `status` | `draft` `confirmed` `partially_delivered` `delivered` `completed` `cancelled` |
| `payment_status` | `unpaid` `partial` `paid` `refunded` |
| `salesperson_id` | nullable, FK users |
| `notes`, `internal_notes` | |
| `confirmed_by`, `confirmed_at`, `cancelled_by`, `cancelled_at`, `cancellation_reason_id` | |

Index `(tenant_id, channel, order_date)`, `(tenant_id, party_id, order_date)`,
`(tenant_id, status)`, `(tenant_id, pos_session_id)`.

### `sales_order_items`
`tenant_id`, `sales_order_id`, `product_id`, `variant_id`, `description`,
`quantity`, `unit_id`, `unit_price`, `discount_percentage`,
`discount_amount`, `tax_profile_id`, `tax_amount`, `line_total`,
`delivered_quantity` (cache), `returned_quantity` (cache), `batch_code`
(nullable), `stock_reservation_id` (nullable), `sort_order`.

**Invariant:** `unit_price` is resolved **server-side** by
`PriceResolver::resolve()`. A client-supplied price is ignored
(ARCHITECTURE §4.4).

### `invoices`
`tenant_id`, `uuid`, `invoice_number` (unique
`(tenant_id, company_id, invoice_number)` — scope is **Q3**),
`sales_order_id`, `company_id`, `branch_id`, `party_id`, `invoice_date`,
`due_date`, `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`,
`round_off`, `total_amount`, `paid_amount` (cache), `status` (`draft`
`posted` `partially_paid` `paid` `void`), `invoice_template_id` (nullable),
`printed_count`, `posted_by`, `posted_at`, `voided_by`, `voided_at`,
`void_reason`.

**Invariant:** a posted invoice is **never edited or deleted** — it is voided,
and a new invoice is issued. `printed_count` increments on every render for
audit.

### `invoice_items`
`tenant_id`, `invoice_id`, `sales_order_item_id` (nullable), `product_id`,
`description`, `quantity`, `unit_id`, `unit_price`, `discount_amount`,
`tax_profile_id`, `tax_amount`, `line_total`, `sort_order`.

### `sales_returns`
`tenant_id`, `return_number`, `invoice_id` (nullable), `sales_order_id`
(nullable), `party_id`, `warehouse_id`, `return_date`, `reason_code_id`,
`restock` (tinyint), `subtotal`, `tax_amount`, `total_amount`,
`refund_method` (`cash` `bank` `credit_note` `exchange`),
`credit_note_number`, `status` (`draft` `approved` `posted` `cancelled`),
`approved_by`, `approved_at`. Unique `(tenant_id, return_number)`.

### `sales_return_items`
`tenant_id`, `sales_return_id`, `invoice_item_id` (nullable), `product_id`,
`variant_id`, `batch_code`, `quantity`, `unit_id`, `unit_price`,
`line_total`, `condition` (`good` `damaged`), `stock_movement_id`
(nullable — NULL when `restock = 0`).

### `pos_sessions`
Shift / cash-drawer session. A POS sale cannot exist without an open session.

`tenant_id`, `session_number`, `branch_id`, `warehouse_id`, `terminal_id`,
`user_id`, `opened_at`, `closed_at`, `opening_cash`, `expected_cash`,
`counted_cash`, `cash_variance`, `card_total`, `mobile_total`,
`credit_total`, `sales_count`, `refund_total`, `status` (`open`
`closing` `closed` `reconciled`), `closed_by`, `notes`.
Unique `(tenant_id, session_number)`.

### `pos_terminals`
`tenant_id`, `branch_id`, `code`, `name`, `default_warehouse_id`,
`printer_config` (json), `is_active`. Unique `(tenant_id, code)`.

### `pos_offline_queue`
Server-side record of writes that were queued on a device (ARCHITECTURE §6.8).

`tenant_id`, `terminal_id`, `user_id`, `idempotency_key`, `payload` (json),
`client_created_at`, `synced_at`, `status` (`pending` `synced` `rejected`),
`rejection_reason`. Unique `(tenant_id, idempotency_key)`.

### `payments`
Covers both receipts (from customers) and payments (to suppliers).

`tenant_id`, `payment_number`, `direction` (`in` `out`), `party_id`,
`company_id`, `branch_id`, `payment_date`, `method` (`cash` `bank_transfer`
`cheque` `card` `mobile_banking` `credit_adjustment`),
`bank_account_id` (nullable), `reference_number`, `amount`,
`allocated_amount` (cache), `unallocated_amount` (cache), `currency_code`,
`status` (`draft` `posted` `bounced` `cancelled`), `received_by`,
`posted_at`, `notes`. Unique `(tenant_id, payment_number)`.

### `payment_allocations`
`tenant_id`, `payment_id`, `allocatable_type` (`invoice` `purchase_bill`
`sales_return` `purchase_return`), `allocatable_id`, `amount`.

**Invariant:** `SUM(payment_allocations.amount) <= payments.amount`. Enforced
in the allocation Action under a row lock.

### `sales_order_payments`
Split-tender support for POS (one sale, cash + card + mobile).

`tenant_id`, `sales_order_id`, `payment_id`, `method`, `amount`,
`change_given`, `reference`.

### `invoice_templates`
Drives the drag-and-drop builder.

`tenant_id`, `company_id` (nullable), `name`, `type` (`invoice` `receipt`
`delivery_note` `purchase_order` `quotation` `payslip`),
`paper_size` (`a4` `a5` `letter` `thermal_80` `thermal_58`),
`orientation`, `definition` (json — the element tree),
`is_default`, `is_active`, `version`, `created_by`.
Unique `(tenant_id, type, name)`.

**`definition` json shape:** a list of positioned elements
(`{ id, type, x, y, w, h, style, binding }`) where `type` is one of the
supported element kinds (text, field, table, image, logo, qr, barcode, line,
box, spacer, signature, totals, terms, page-number, …) and `binding` is a
whitelisted document path. **Arbitrary expressions are not evaluated** — the
render path is a fixed interpreter, not `eval`.

### `crm_leads`
`tenant_id`, `lead_number`, `name`, `company_name`, `phone`, `email`,
`source` (`walk_in` `phone` `referral` `online` `field_visit` `other`),
`stage` (`new` `contacted` `qualified` `proposal` `won` `lost`),
`assigned_to`, `expected_value`, `expected_close_date`,
`lost_reason_id` (nullable), `converted_party_id` (nullable),
`converted_at`, `notes`. Unique `(tenant_id, lead_number)`.

### `crm_activities`
`tenant_id`, `subject_type` (`lead` `party`), `subject_id`,
`type` (`call` `visit` `email` `sms` `note` `task`), `title`,
`description`, `due_at`, `completed_at`, `outcome`, `assigned_to`,
`created_by`. Index `(tenant_id, subject_type, subject_id)`,
`(tenant_id, assigned_to, due_at)`.

---

## 9. Group H — Delivery and couriers

### `delivery_orders`
`tenant_id`, `uuid`, `delivery_number`, `sales_order_id`, `invoice_id`
(nullable), `party_id`, `warehouse_id`, `delivery_address_id`,
`recipient_name`, `recipient_phone`, `delivery_type` (`own_delivery`
`courier` `pickup`), `courier_provider_id` (nullable),
`courier_shipment_id` (nullable), `run_sheet_id` (nullable),
`rider_id` (nullable, FK users), `scheduled_date`, `delivered_at`,
`status` (11 values below), `cod_amount`, `cod_collected_amount`,
`cod_status` (`not_applicable` `pending` `collected` `deposited`
`reconciled`), `delivery_charge`, `weight`, `package_count`,
`special_instructions`, `attempt_count`,
`failure_reason_id` (nullable), `pod_signature_path`, `pod_photo_path`,
`pod_received_by`, `stock_movement_id` (nullable).
Unique `(tenant_id, delivery_number)`.

**The 11 delivery statuses**

```
pending → assigned → picked_up → in_transit → out_for_delivery → delivered
                                       │
                                       ├─▶ failed  ─▶ rescheduled ─▶ (retry)
                                       ├─▶ returned
                                       ├─▶ cancelled
                                       └─▶ on_hold
```

`pending` · `assigned` · `picked_up` · `in_transit` · `out_for_delivery` ·
`delivered` · `failed` · `rescheduled` · `returned` · `cancelled` ·
`on_hold`

### `delivery_order_items`
`tenant_id`, `delivery_order_id`, `sales_order_item_id`, `product_id`,
`variant_id`, `batch_code`, `quantity`, `delivered_quantity`,
`returned_quantity`, `unit_id`.

### `delivery_status_events`
Append-only timeline. Never updated.

`tenant_id`, `delivery_order_id`, `status`, `source` (`system` `rider`
`courier_webhook` `manual`), `courier_event_id` (nullable),
`occurred_at`, `location`, `latitude`, `longitude`, `notes`,
`raw_payload` (json), `created_by`.
Unique `(tenant_id, delivery_order_id, courier_event_id)` — **this is the
webhook idempotency guard** (ADR-017).

### `run_sheets`
Own-fleet dispatch document.

`tenant_id`, `run_sheet_number`, `branch_id`, `rider_id`, `vehicle_id`
(nullable, FK `assets`), `run_date`, `status` (`draft` `dispatched`
`in_progress` `completed` `reconciled`), `total_stops`,
`completed_stops`, `total_cod_expected`, `total_cod_collected`,
`dispatched_at`, `returned_at`, `reconciled_by`, `reconciled_at`.
Unique `(tenant_id, run_sheet_number)`.

### `courier_providers`
`tenant_id` **nullable** — a NULL row is a platform-provided provider
definition; a tenant row holds that tenant's credentials (**Q4** decides which
is used).

`code` (`pathao` `steadfast` `redx` `paperfly` `ecourier` `custom`),
`name`, `adapter_class`, `is_active`, `credentials` (json, **encrypted**),
`capabilities` (json — the capability matrix), `webhook_secret`,
`default_charge`, `settings` (json).

**`capabilities` keys:** `create_shipment`, `cancel_shipment`, `get_status`,
`get_label`, `calculate_rate`, `schedule_pickup`, `webhook`, `cod`,
`partial_delivery`, `return_pickup`. Unsupported capabilities are disabled in
the UI, never attempted (ADR-017, ADR-024).

### `courier_shipments`
`tenant_id`, `delivery_order_id`, `courier_provider_id`, `consignment_id`,
`awb_number`, `label_path`, `tracking_url`, `status`,
`provider_status_raw`, `charge_amount`, `cod_amount`,
`requested_at`, `confirmed_at`, `last_synced_at`,
`request_payload` (json), `response_payload` (json), `error_message`,
`retry_count`. Unique `(tenant_id, courier_provider_id, consignment_id)`.

### `courier_webhook_events`
`tenant_id` (nullable until resolved), `courier_provider_id`,
`provider_event_id`, `signature_valid` (tinyint), `payload` (json),
`processed_at`, `status` (`received` `processed` `duplicate`
`invalid_signature` `failed`), `error_message`.
Unique `(courier_provider_id, provider_event_id)`.

### `cod_reconciliations`
`tenant_id`, `reconciliation_number`, `source_type` (`run_sheet`
`courier_provider`), `source_id`, `period_start`, `period_end`,
`expected_amount`, `received_amount`, `variance_amount`,
`bank_account_id`, `status` (`draft` `reconciled` `disputed`),
`reconciled_by`, `reconciled_at`, `notes`.
Unique `(tenant_id, reconciliation_number)`.

---

## 10. Group I — HR, attendance & payroll

Module owners: `hr-employees`, `hr-attendance`, `hr-payroll`
(MODULE_MAP §1.7). Phase 7, **except** the minimal `employees` identity slice
which ships in Phase 3 because `worker_production_entries` cannot exist
without it (MODULE_MAP §4).

### The Phase 3 / Phase 7 split

`employees` is created **once**, in Phase 3, with its full column set. Phase 3
populates and uses only the identity columns; Phase 7 activates the
employment and payroll columns. The table is not migrated twice.

```
Phase 3 (identity slice)          Phase 7 (full HR)
--------------------------------  --------------------------------
employee_code                     department_id, designation_id
first_name, last_name             date_of_joining, date_of_leaving
factory_id, production_line_id     employment_type, employment_status
is_active                         salary_structure_id
                                  bank/contact/document columns
```

### `departments`
`tenant_id`, `company_id`, `code`, `name`, `parent_id` (nullable,
self-referencing), `cost_center_code` (nullable), `head_employee_id`
(nullable), `is_active`.
Unique `(tenant_id, company_id, code)`.

**Note:** `head_employee_id` is a nullable FK to `employees`, which itself
references `departments`. The circular reference is broken by adding this FK
in a **later migration**, after both tables exist (§16).

### `designations`
`tenant_id`, `code`, `name`, `grade` (nullable), `is_active`.
Unique `(tenant_id, code)`.

### `employees`
`tenant_id`, `uuid`, `employee_code` (unique `(tenant_id, employee_code)`),
`user_id` (nullable, unique when set — **not every employee logs in**;
a floor worker recorded by a supervisor has no `users` row),
`company_id`, `branch_id`, `factory_id` (nullable),
`production_line_id` (nullable), `department_id` (nullable),
`designation_id` (nullable), `reports_to_employee_id` (nullable),
`first_name`, `last_name`, `display_name`, `gender` (nullable),
`date_of_birth` (nullable), `national_id` (nullable), `phone`, `email`
(nullable), `address_line1`, `address_line2`, `city`, `photo_path`
(nullable), `date_of_joining`, `date_of_leaving` (nullable),
`employment_type` (`permanent` `contract` `daily_wage` `piece_rate`
`probation`), `employment_status` (`active` `on_leave` `suspended`
`resigned` `terminated`), `default_shift_id` (nullable),
`salary_structure_id` (nullable), `bank_name` (nullable),
`bank_account_number` (nullable), `mobile_wallet_number` (nullable),
`is_active`.

**Invariant:** `employment_type = piece_rate` is what makes a
`worker_production_entries` row payable per unit. A `permanent` worker may
still have production entries — they are used for productivity reporting but
are **not** multiplied by a piece rate.

**Invariant:** `user_id` is nullable and this is deliberate. `employees` is
the workforce record; `users` is the login record. Conflating them was one of
the legacy design faults (DECISIONS C18).

### `employee_documents`
`tenant_id`, `employee_id`, `document_type` (`nid` `contract` `certificate`
`photo` `other`), `attachment_id`, `issued_on` (nullable), `expires_on`
(nullable), `notes`.

### `shifts`
`tenant_id`, `code`, `name`, `start_time`, `end_time`,
`crosses_midnight` (tinyint), `break_minutes`,
`grace_in_minutes`, `grace_out_minutes`,
`half_day_threshold_minutes`, `is_active`.
Unique `(tenant_id, code)`.

**Invariant:** when `crosses_midnight = 1`, `end_time < start_time` and the
attendance engine attributes the shift to the **start** date. Every
attendance calculation reads this flag; comparing raw times without it is a
defect.

### `shift_assignments`
`tenant_id`, `employee_id`, `shift_id`, `effective_from`, `effective_to`
(nullable), `assigned_by`.
Index `(tenant_id, employee_id, effective_from)`.

### `attendances`
`tenant_id`, `employee_id`, `attendance_date`, `shift_id` (nullable),
`check_in_at` (nullable), `check_out_at` (nullable),
`check_in_source` (`manual` `biometric` `mobile` `import`),
`check_out_source`, `worked_minutes` (nullable),
`late_minutes`, `early_leave_minutes`, `overtime_minutes`,
`status` (`present` `absent` `late` `half_day` `on_leave` `holiday`
`weekly_off`), `leave_request_id` (nullable), `remarks`,
`approved_by` (nullable), `approved_at` (nullable),
`payroll_period_id` (nullable).
Unique `(tenant_id, employee_id, attendance_date)`.
Index `(tenant_id, attendance_date, status)`.

**Invariant:** one row per employee per date — enforced by the unique key,
not by application checks. Double punches update the existing row.

**Invariant:** `worked_minutes`, `late_minutes` and `overtime_minutes` are
**NULL / not final** until `check_out_at` is set. They are computed by the
attendance engine, never posted from the client.

**Invariant:** once `payroll_period_id` is set the row is **immutable** —
identical rule to `worker_production_entries` (§5). Corrections after payroll
lock require an adjustment on the next period, never an edit.

### `leave_types`
`tenant_id`, `code`, `name`, `is_paid` (tinyint), `annual_quota_days`,
`accrual_method` (`none` `monthly` `yearly` `on_join`),
`carry_forward_allowed` (tinyint), `max_carry_forward_days`,
`requires_attachment` (tinyint), `min_notice_days`, `is_active`.
Unique `(tenant_id, code)`.

### `leave_balances`
`tenant_id`, `employee_id`, `leave_type_id`, `year`,
`opening_days`, `accrued_days`, `used_days`, `carried_forward_days`,
`balance_days` (cache).
Unique `(tenant_id, employee_id, leave_type_id, year)`.

**Invariant:** `balance_days` is a **derived cache**, recomputable from
`leave_requests`. It follows the same rule as `stock_balances` (§6): it is
only written inside the transaction that approves or cancels a leave request.

### `leave_requests`
`tenant_id`, `request_number`, `employee_id`, `leave_type_id`,
`start_date`, `end_date`, `total_days`, `is_half_day` (tinyint),
`reason`, `attachment_id` (nullable),
`status` (`draft` `submitted` `approved` `rejected` `cancelled`),
`approved_by` (nullable), `approved_at` (nullable),
`rejection_reason` (nullable).
Unique `(tenant_id, request_number)`.
Index `(tenant_id, employee_id, start_date)`.

**Invariant:** approving a leave request writes the `attendances` rows for
the covered dates with `status = on_leave` **in the same transaction**
(ARCHITECTURE §6.1, boundary 9). Approval without attendance rows is a
defect.

### `holidays`
`tenant_id`, `company_id` (nullable = all companies), `name`,
`holiday_date`, `is_recurring` (tinyint), `applies_to_branch_id`
(nullable).
Index `(tenant_id, holiday_date)`.

### `salary_structures`
`tenant_id`, `code`, `name`, `effective_from`, `effective_to` (nullable),
`pay_frequency` (`monthly` `weekly` `daily` `piece_rate`),
`is_active`, `notes`.
Unique `(tenant_id, code, effective_from)`.

### `salary_structure_components`
`tenant_id`, `salary_structure_id`, `component_id`, `calculation_type`
(`fixed` `percentage` `formula` `per_unit` `per_day` `per_hour`),
`value`, `base_component_id` (nullable, for `percentage`),
`sort_order`.

### `salary_components`
`tenant_id`, `code`, `name`, `component_type` (`earning` `deduction`
`employer_contribution`), `is_taxable` (tinyint),
`affects_gross` (tinyint), `is_active`.
Unique `(tenant_id, code)`.

**Design note:** components are **data, not code**. Adding a new allowance
must never require a migration or a deploy.

### `payroll_periods`
`tenant_id`, `company_id`, `period_code`, `pay_frequency`,
`period_start`, `period_end`, `payment_date`,
`status` (`open` `calculating` `calculated` `approved` `paid` `closed`),
`total_gross`, `total_deductions`, `total_net`, `employee_count`,
`calculated_by`, `calculated_at`, `approved_by`, `approved_at`,
`locked_at` (nullable).
Unique `(tenant_id, company_id, period_code)`.

**Invariant:** on transition to `calculated`, the period **stamps its id**
onto every consumed `attendances` and `worker_production_entries` row,
freezing them. This is the single mechanism that makes payroll reproducible
(ARCHITECTURE §6.1, boundary 10).

### `payslips`
`tenant_id`, `payroll_period_id`, `employee_id`, `payslip_number`,
`gross_amount`, `total_earnings`, `total_deductions`, `net_amount`,
`paid_days`, `absent_days`, `leave_days`, `overtime_minutes`,
`produced_quantity` (nullable — piece-rate workers),
`payment_method` (`cash` `bank` `mobile_wallet`),
`payment_status` (`unpaid` `paid` `partially_paid` `on_hold`),
`paid_at` (nullable), `payment_reference` (nullable).
Unique `(tenant_id, payroll_period_id, employee_id)`.

**Invariant:** `total_earnings - total_deductions = net_amount`, asserted in
the calculation transaction.

### `payslip_items`
`tenant_id`, `payslip_id`, `salary_component_id`, `component_code` (**copied
label**), `component_type`, `calculation_basis` (json — the inputs used),
`quantity` (nullable), `rate` (nullable), `amount`, `sort_order`.

**Invariant:** `component_code`, `component_type` and `calculation_basis` are
**snapshotted**. Renaming or deleting a salary component must never alter a
historical payslip (DECISIONS ADR-019, the snapshot rule).

### `payroll_advances`
`tenant_id`, `employee_id`, `advance_number`, `amount`, `issued_on`,
`recovery_start_period_id`, `installment_amount`, `recovered_amount`,
`status` (`active` `recovered` `written_off`), `notes`.

---

## 11. Group J — Assets & maintenance

Module owners: `asset-registry`, `asset-maintenance` (MODULE_MAP §1.8).
Phase 7.

### `asset_categories`
`tenant_id`, `code`, `name`, `parent_id` (nullable),
`default_depreciation_method` (`none` `straight_line` `declining_balance`),
`default_useful_life_months`, `default_salvage_percentage`, `is_active`.
Unique `(tenant_id, code)`.

### `assets`
`tenant_id`, `uuid`, `asset_code` (unique `(tenant_id, asset_code)`),
`asset_tag` (nullable — the physical barcode/QR label),
`name`, `asset_category_id`, `company_id`, `branch_id`,
`factory_id` (nullable), `production_line_id` (nullable),
`warehouse_id` (nullable), `assigned_employee_id` (nullable),
`serial_number` (nullable), `manufacturer` (nullable), `model` (nullable),
`purchase_date` (nullable), `purchase_order_id` (nullable),
`supplier_party_id` (nullable), `purchase_cost`,
`depreciation_method`, `useful_life_months`, `salvage_value`,
`accumulated_depreciation`, `book_value` (cache),
`warranty_expires_on` (nullable),
`status` (`in_use` `idle` `under_maintenance` `in_repair` `retired`
`disposed` `lost`),
`condition` (`new` `good` `fair` `poor` `unserviceable`),
`disposal_date` (nullable), `disposal_amount` (nullable),
`disposal_reason` (nullable), `notes`.
Index `(tenant_id, asset_category_id, status)`.

**Boundary rule:** an asset is **not stock**. It never appears in
`stock_movements`. Machinery, vehicles and tools live here; consumable spare
parts live in `products` with `product_type = spare_part`. Confusing the two
was a legacy fault (DECISIONS C21).

**Invariant:** `book_value = purchase_cost - accumulated_depreciation`, never
below `salvage_value`.

### `asset_assignments`
`tenant_id`, `asset_id`, `assigned_to_type` (`employee` `branch` `factory`
`production_line` `vehicle`), `assigned_to_id`,
`assigned_from`, `assigned_to_date` (nullable),
`assigned_by`, `returned_at` (nullable), `condition_on_return` (nullable),
`notes`.
Index `(tenant_id, asset_id, assigned_from)`.

**Invariant:** at most **one open assignment** per asset — enforced by a
partial-uniqueness check inside the assignment transaction (MySQL 8 has no
partial unique index; the guard is a `SELECT ... FOR UPDATE` on open rows).

### `asset_depreciation_entries`
`tenant_id`, `asset_id`, `period_year`, `period_month`,
`opening_book_value`, `depreciation_amount`, `closing_book_value`,
`journal_entry_id` (nullable), `posted_at`.
Unique `(tenant_id, asset_id, period_year, period_month)`.

**Invariant:** depreciation is an **append-only ledger**, exactly like
`stock_movements`. `assets.accumulated_depreciation` is the derived cache.

### `maintenance_schedules`
`tenant_id`, `asset_id`, `code`, `name`,
`trigger_type` (`time_interval` `meter_reading` `both`),
`interval_days` (nullable), `interval_meter_units` (nullable),
`last_performed_on` (nullable), `last_meter_reading` (nullable),
`next_due_on` (nullable), `next_due_meter` (nullable),
`checklist` (json), `assigned_team` (nullable), `is_active`.
Index `(tenant_id, next_due_on)`.

### `maintenance_orders`
`tenant_id`, `order_number`, `asset_id`, `maintenance_schedule_id`
(nullable), `maintenance_type` (`preventive` `corrective` `breakdown`
`inspection` `calibration`),
`priority` (`low` `normal` `high` `critical`),
`reported_by` (nullable), `reported_at`,
`problem_description`, `diagnosis` (nullable),
`scheduled_start`, `scheduled_end`,
`actual_start` (nullable), `actual_end` (nullable),
`downtime_minutes` (nullable),
`status` (`requested` `approved` `scheduled` `in_progress` `on_hold`
`completed` `cancelled`),
`performed_by_employee_id` (nullable),
`vendor_party_id` (nullable),
`labour_cost`, `parts_cost`, `external_cost`, `total_cost`,
`completion_notes` (nullable), `approved_by` (nullable).
Unique `(tenant_id, order_number)`.
Index `(tenant_id, asset_id, status)`.

**Invariant:** `total_cost = labour_cost + parts_cost + external_cost`.

**Invariant:** when a maintenance order consumes spare parts, it writes
`stock_movements` rows with `movement_type = maintenance_consumption` and
`reference_type = maintenance_order` — **in the same transaction** as the
`parts_cost` update. A consumed part that never left stock is a defect.

### `maintenance_order_parts`
`tenant_id`, `maintenance_order_id`, `product_id`, `warehouse_id`,
`quantity`, `unit_id`, `unit_cost`, `line_cost`,
`stock_movement_id` (nullable — set once issued).

### `asset_meter_readings`
`tenant_id`, `asset_id`, `reading_at`, `meter_type` (`hours` `kilometres`
`cycles` `units_produced`), `reading_value`, `recorded_by`, `notes`.
Index `(tenant_id, asset_id, reading_at)`.

**Invariant:** readings are monotonic per `meter_type`. A lower reading than
the previous one is rejected unless flagged `meter_reset`.

---

## 12. Group K — Finance & costing

Module owners: `finance-expenses`, `finance-ledger`, `finance-costing`
(MODULE_MAP §1.9). Phase 7.

### Scope boundary (read this before writing any migration)

This is **not a full double-entry accounting package**. Per DECISIONS
ADR-018, the finance group delivers:

| In scope | Out of scope (v1) |
|---|---|
| Expense capture and approval | Multi-currency revaluation |
| Cash/bank accounts and transfers | Consolidated group accounts |
| A light general ledger fed by the modules | Statutory tax filing forms |
| Receivables / payables ageing | Fixed-asset tax books |
| Product costing and margin analysis | Budgeting and forecasting |

`chart_of_accounts` and `journal_entries` exist so that stock, payroll,
sales and depreciation postings have somewhere consistent to land. Modules
**push** journals; the ledger never reaches into a module.

### `chart_of_accounts`
`tenant_id`, `company_id`, `account_code`, `name`,
`account_type` (`asset` `liability` `equity` `income` `expense`),
`account_subtype` (`cash` `bank` `receivable` `inventory` `fixed_asset`
`payable` `tax` `capital` `sales` `other_income` `cogs` `payroll`
`depreciation` `operating_expense`),
`parent_id` (nullable), `is_group` (tinyint), `normal_balance`
(`debit` `credit`), `is_system` (tinyint — cannot be deleted),
`is_active`.
Unique `(tenant_id, company_id, account_code)`.

**Invariant:** `is_group = 1` accounts **cannot be posted to**. Only leaf
accounts accept journal lines.

### `journal_entries`
`tenant_id`, `company_id`, `entry_number`, `entry_date`,
`entry_type` (`manual` `system`),
`source_module` (nullable — `inventory` `sales` `purchase` `payroll`
`assets` `expenses`),
`reference_type` (nullable), `reference_id` (nullable),
`narration`, `total_debit`, `total_credit`,
`status` (`draft` `posted` `void`),
`posted_by`, `posted_at`, `voided_by`, `voided_at`, `void_reason`,
`reversal_of_entry_id` (nullable).
Unique `(tenant_id, company_id, entry_number)`.
Index `(tenant_id, entry_date)`, `(tenant_id, reference_type, reference_id)`.

**Invariant:** `total_debit = total_credit`, asserted **before** the status
becomes `posted`. An unbalanced posted entry is a defect.

**Invariant:** a posted entry is **never edited or deleted** — it is reversed
by a new entry carrying `reversal_of_entry_id`. Same rule as `invoices` (§8)
and `stock_movements` (§6).

### `journal_lines`
`tenant_id`, `journal_entry_id`, `account_id`, `debit_amount`,
`credit_amount`, `branch_id` (nullable), `cost_center_code` (nullable),
`party_id` (nullable), `narration`, `sort_order`.
Index `(tenant_id, account_id)`.

**Invariant:** exactly one of `debit_amount` / `credit_amount` is non-zero
per line. Both non-zero, or both zero, is a defect.

### `expense_categories`
`tenant_id`, `code`, `name`, `parent_id` (nullable),
`default_account_id` (nullable), `requires_attachment` (tinyint),
`approval_threshold` (nullable), `is_active`.
Unique `(tenant_id, code)`.

### `expenses`
`tenant_id`, `uuid`, `expense_number`, `company_id`, `branch_id`,
`expense_category_id`, `expense_date`,
`payee_type` (`party` `employee` `other`), `payee_id` (nullable),
`payee_name` (**snapshot label**),
`description`, `amount`, `tax_amount`, `total_amount`,
`payment_method` (`cash` `bank` `mobile_wallet` `credit` `cheque`),
`bank_account_id` (nullable), `reference_number` (nullable),
`attachment_id` (nullable),
`status` (`draft` `submitted` `approved` `rejected` `paid` `void`),
`submitted_by`, `approved_by` (nullable), `approved_at` (nullable),
`rejection_reason` (nullable), `paid_at` (nullable),
`journal_entry_id` (nullable),
`cost_center_code` (nullable), `related_module` (nullable),
`related_reference_type` (nullable), `related_reference_id` (nullable).
Unique `(tenant_id, expense_number)`.
Index `(tenant_id, expense_date, status)`.

**Design note:** `related_module` / `related_reference_*` is how a delivery
fuel cost, a maintenance external charge or a production overhead attaches
itself to its originating document without the finance module importing every
other module's models.

### `bank_accounts`
`tenant_id`, `company_id`, `code`, `name`,
`account_type` (`cash` `bank` `mobile_wallet`),
`bank_name` (nullable), `account_number` (nullable), `branch_name`
(nullable), `currency` (default tenant currency),
`chart_of_account_id`, `opening_balance`, `current_balance` (cache),
`is_default_for_pos` (tinyint), `is_active`.
Unique `(tenant_id, company_id, code)`.

**Invariant:** `current_balance` is a **derived cache** over
`bank_transactions`, rebuildable, and written only inside a transaction
that also appends the transaction row. Same rule as `stock_balances`.

### `bank_transactions`
`tenant_id`, `bank_account_id`, `transaction_date`,
`direction` (`in` `out`), `amount`, `running_balance`,
`transaction_type` (`receipt` `payment` `transfer_in` `transfer_out`
`pos_settlement` `cod_settlement` `payroll_disbursement` `expense`
`adjustment` `opening`),
`reference_type` (nullable), `reference_id` (nullable),
`related_transaction_id` (nullable — the paired leg of a transfer),
`journal_entry_id` (nullable),
`description`, `cleared_at` (nullable),
`reconciliation_status` (`unreconciled` `reconciled` `disputed`).
Index `(tenant_id, bank_account_id, transaction_date)`.

**Invariant:** append-only. A transfer between two accounts is **exactly two
rows in one transaction**, linked by `related_transaction_id` — the same
paired-row pattern as inventory transfers (§6).

### `payment_terms`
`tenant_id`, `code`, `name`, `net_days`,
`discount_percentage` (nullable), `discount_days` (nullable), `is_active`.
Unique `(tenant_id, code)`.

### `party_credit_limits`
`tenant_id`, `party_id`, `credit_limit`, `payment_term_id` (nullable),
`current_outstanding` (cache), `blocked` (tinyint), `blocked_reason`
(nullable), `reviewed_by`, `reviewed_at`.
Unique `(tenant_id, party_id)`.

**Invariant:** `current_outstanding` is a cache over `invoices` and
`payments`. The credit check at order confirmation recomputes it **under a
row lock** rather than trusting the cache (ARCHITECTURE §6.1, boundary 6).

### `product_costs`
`tenant_id`, `product_id`, `variant_id` (nullable), `warehouse_id`
(nullable — NULL = tenant-wide),
`costing_method` (`weighted_average` `fifo` `standard` `last_purchase`),
`material_cost`, `labour_cost`, `overhead_cost`, `total_cost`,
`standard_cost` (nullable), `last_purchase_cost` (nullable),
`effective_from`, `effective_to` (nullable),
`source` (`purchase` `production` `manual` `recalculation`),
`source_reference_type` (nullable), `source_reference_id` (nullable),
`calculated_at`.
Index `(tenant_id, product_id, effective_from)`.

**Invariant:** `total_cost = material_cost + labour_cost + overhead_cost`.

**Invariant:** cost history is **append-only and time-sliced**. Overwriting
a historical cost row destroys margin history and is a defect.

**Invariant:** the default `costing_method` is `weighted_average`, resolved
per tenant from `settings` (DECISIONS ADR-018). FIFO layers are **Q5** and
are not implemented in v1.

### `production_cost_allocations`
`tenant_id`, `production_batch_id`, `cost_type` (`material` `labour`
`machine` `utility` `overhead` `wastage`),
`source_reference_type` (nullable), `source_reference_id` (nullable),
`amount`, `allocation_basis` (`actual` `per_unit` `per_hour`
`percentage_of_material`), `allocated_at`, `notes`.
Index `(tenant_id, production_batch_id)`.

**Invariant:** a batch's cost can only be finalised when
`context_completeness = context_complete` (§5). Allocating overhead onto a
`collecting` batch produces a number that will change, so it is forbidden —
the API returns `PRODUCTION_CONTEXT_INCOMPLETE`.

### `taxes_summary` *(materialised — see §13)*
Deferred to Group L with the other summary tables.

---

## 13. Group L — Reporting, e-commerce & system

Module owners: `reporting-rms`, `reporting-dashboards`, `ecom-storefront`,
`ecom-orders`, `platform-settings`, `platform-jobs` (MODULE_MAP §1.10).
Phases 8–9.

### 13.1 Reporting — the read model

Reports **never** invent tables of truth. Every summary table here is
**derived and rebuildable** from the transactional tables in Groups A–K. If a
summary is deleted, a rebuild job must reproduce it exactly.

Per DECISIONS ADR-017, reporting uses a **two-tier** strategy:

| Tier | Mechanism | Used for |
|---|---|---|
| Tier 1 | Direct indexed query against transactional tables | Any report over ≤ 90 days or ≤ ~100k rows |
| Tier 2 | Pre-aggregated summary table refreshed by a queued job | Dashboards, multi-year trends, tenant-wide rollups |

**Rule:** a report starts as Tier 1. It is promoted to Tier 2 only when a
measured p95 exceeds the budget in ARCHITECTURE §5.10. Building summary tables
speculatively is forbidden.

#### `report_definitions`
`tenant_id` (nullable — NULL = platform-provided definition), `code`,
`name`, `module`, `category` (`operational` `analytical` `compliance`
`financial`), `description`,
`default_filters` (json), `available_columns` (json),
`required_permission` (the `module.resource.action` string),
`supports_export` (tinyint), `tier` (`live` `summary`),
`summary_table` (nullable), `is_active`.
Unique `(tenant_id, code)` — with a NULL-tenant platform row as the base.

**Design note:** this table is what makes RMS a **registry**, not 60
hand-written pages. `RMS_REPORT_MATRIX.md` is the human-readable index of
these rows.

#### `report_saved_views`
`tenant_id`, `report_definition_id`, `user_id`, `name`,
`filters` (json), `columns` (json), `sort` (json),
`is_shared` (tinyint), `is_default` (tinyint).
Index `(tenant_id, user_id, report_definition_id)`.

#### `report_schedules`
`tenant_id`, `report_definition_id`, `report_saved_view_id` (nullable),
`name`, `frequency` (`daily` `weekly` `monthly`),
`run_at_time`, `day_of_week` (nullable), `day_of_month` (nullable),
`format` (`pdf` `xlsx` `csv`),
`recipients` (json — user ids and/or e-mail addresses),
`last_run_at` (nullable), `last_status` (nullable), `next_run_at`,
`is_active`.
Index `(tenant_id, next_run_at, is_active)`.

#### `report_exports`
`tenant_id`, `report_definition_id`, `requested_by`, `filters` (json),
`format`, `row_count` (nullable), `file_path` (nullable),
`file_size_bytes` (nullable),
`status` (`queued` `processing` `completed` `failed` `expired`),
`error_message` (nullable), `expires_at`, `downloaded_count`.
Index `(tenant_id, requested_by, created_at)`.

**Invariant:** exports run on the **queue**, never inline in the request
(ARCHITECTURE §4.5). The UI polls this row and shows the
`queued → processing → completed` states from the state matrix
(DECISIONS ADR-024).

#### Summary tables (Tier 2)

All share the shape *(tenant_id, scope keys, date bucket, measures,
refreshed_at)*, all are `UNIQUE` on *(tenant_id, scope keys, bucket)*, and
all are rebuildable.

| Table | Grain | Key measures |
|---|---|---|
| `summary_daily_production` | tenant, factory, line, product, date | input_qty, output_qty, yield_pct, wastage_qty, rework_qty, scrap_qty, batch_count |
| `summary_daily_worker_output` | tenant, employee, product, date | produced_qty, rejected_qty, hours, piece_amount |
| `summary_daily_sales` | tenant, branch, channel, date | order_count, gross_amount, discount_amount, tax_amount, net_amount, returned_amount |
| `summary_daily_stock` | tenant, warehouse, product, date | opening_qty, in_qty, out_qty, closing_qty, closing_value |
| `summary_daily_delivery` | tenant, branch, courier_provider, date | dispatched, delivered, failed, returned, cod_expected, cod_received |
| `summary_monthly_finance` | tenant, company, account, year, month | debit_total, credit_total, net_movement, closing_balance |
| `summary_monthly_payroll` | tenant, company, year, month | employee_count, gross, deductions, net, overtime_minutes |
| `summary_product_margin` | tenant, product, year, month | qty_sold, revenue, cost, gross_margin, margin_pct |
| `summary_taxes` | tenant, company, tax_profile, year, month | taxable_amount, tax_collected, tax_paid, net_tax |

**Invariant:** every summary row carries `refreshed_at`. A dashboard that
renders a summary **must display its freshness**; showing a stale figure as
if it were live violates the UI charter (DECISIONS ADR-021).

**Invariant:** `summary_daily_production` **excludes** batches whose
`context_completeness` is `draft` or `collecting`. Aggregating an incomplete
batch would publish a yield number that is going to change — the exact fault
the deferred-variance design exists to prevent (ADR-013).

#### `dashboard_widgets`
`tenant_id`, `user_id` (nullable — NULL = role default layout),
`role_id` (nullable), `widget_code`, `title_override` (nullable),
`grid_x`, `grid_y`, `grid_w`, `grid_h`,
`config` (json), `is_visible`, `sort_order`.
Index `(tenant_id, user_id)`, `(tenant_id, role_id)`.

**Invariant:** a widget the user lacks permission for is **not rendered and
not fetched**. It is filtered server-side out of the layout response, never
hidden with CSS.

---

### 13.2 E-commerce (Phase 9)

Per DECISIONS ADR-016, the storefront is a **channel over the same sales
core**, not a second application. There is no `ecom_orders` table — an online
order is a `sales_orders` row with `channel = online`.

#### `storefronts`
`tenant_id`, `uuid`, `code`, `name`, `domain` (nullable, unique when set),
`subdomain` (unique), `company_id`, `default_branch_id`,
`default_warehouse_id`, `price_list_id` (nullable),
`currency`, `locale` (`en` `bn`),
`theme` (json — the whitelisted branding tokens only, UI_SYSTEM §7),
`logo_attachment_id` (nullable), `favicon_attachment_id` (nullable),
`meta_title`, `meta_description`,
`guest_checkout_enabled` (tinyint), `cod_enabled` (tinyint),
`online_payment_enabled` (tinyint), `min_order_amount` (nullable),
`status` (`draft` `live` `maintenance` `suspended`), `published_at`.
Unique `(tenant_id, code)`.

**Invariant:** `theme` accepts **only** the whitelisted token overrides. An
arbitrary CSS blob is rejected — tenant branding may not break contrast
guarantees (DECISIONS ADR-023).

#### `storefront_pages`
`tenant_id`, `storefront_id`, `slug`, `title`,
`page_type` (`home` `category` `content` `policy` `contact` `custom`),
`blocks` (json — interpreted by a **fixed renderer**, never `eval`),
`meta_title`, `meta_description`,
`status` (`draft` `published`), `published_at`, `sort_order`.
Unique `(tenant_id, storefront_id, slug)`.

#### `storefront_products`
`tenant_id`, `storefront_id`, `product_id`, `variant_id` (nullable),
`display_name_override` (nullable), `description_override` (nullable),
`price_override` (nullable), `compare_at_price` (nullable),
`is_featured` (tinyint), `is_available` (tinyint),
`sold_out_behaviour` (`hide` `show_sold_out` `allow_backorder`),
`seo_slug`, `sort_order`.
Unique `(tenant_id, storefront_id, product_id, variant_id)`.
Unique `(tenant_id, storefront_id, seo_slug)`.

**Invariant:** publishing to a storefront requires `products.is_online = 1`
(§4). Two independent flags is deliberate: `is_online` is the product's
own eligibility, `is_available` is per-storefront merchandising.

**Invariant:** the price shown to a shopper is resolved by the **same**
`PriceResolver` used by POS and dealer sales. A storefront price path that
bypasses it is a defect (ARCHITECTURE §4.4).

#### `carts`
`tenant_id`, `storefront_id`, `uuid` (the public cart token),
`customer_party_id` (nullable — NULL = guest),
`session_token`, `email` (nullable), `phone` (nullable),
`item_count`, `subtotal`, `discount_amount`, `tax_amount`,
`shipping_amount`, `total_amount`,
`coupon_code` (nullable), `price_list_id` (nullable),
`status` (`active` `converted` `abandoned` `expired`),
`converted_sales_order_id` (nullable),
`abandoned_at` (nullable), `expires_at`, `last_activity_at`,
`ip_address`, `user_agent`.
Index `(tenant_id, storefront_id, status, last_activity_at)`.

**Invariant:** a cart **never reserves stock**. Reservation happens at
checkout, inside the order-placement transaction, via `stock_reservations`
(§6). Reserving on add-to-cart would let an abandoned cart starve real orders.

#### `cart_items`
`tenant_id`, `cart_id`, `product_id`, `variant_id` (nullable),
`product_name` (**snapshot**), `quantity`, `unit_id`,
`unit_price` (snapshot at add time), `line_discount`, `tax_amount`,
`line_total`, `price_stale` (tinyint), `added_at`.

**Invariant:** prices are **re-resolved at checkout**. If a re-resolved price
differs from the snapshot, `price_stale` is set and the shopper is shown an
explicit "price changed" confirmation — never silently charged the new amount
and never silently held to the old one.

#### `coupons`
`tenant_id`, `storefront_id` (nullable — NULL = all storefronts),
`code`, `name`, `discount_type` (`percentage` `fixed` `free_shipping`),
`discount_value`, `min_order_amount` (nullable),
`max_discount_amount` (nullable),
`applies_to` (`order` `product` `category`), `applies_to_ids` (json),
`usage_limit_total` (nullable), `usage_limit_per_customer` (nullable),
`used_count`, `starts_at`, `ends_at`, `is_active`.
Unique `(tenant_id, code)`.

**Invariant:** `used_count` is incremented **under a row lock** in the order
transaction. Two shoppers must not both consume the last use of a coupon.

#### `coupon_redemptions`
`tenant_id`, `coupon_id`, `sales_order_id`, `customer_party_id` (nullable),
`discount_amount`, `redeemed_at`.
Unique `(tenant_id, coupon_id, sales_order_id)`.

#### `shipping_zones`
`tenant_id`, `storefront_id`, `name`,
`match_type` (`district` `city` `postcode` `country` `catch_all`),
`match_values` (json),
`rate_type` (`flat` `per_kg` `per_item` `free_over_amount` `courier_quote`),
`base_rate`, `per_unit_rate` (nullable), `free_over_amount` (nullable),
`courier_provider_id` (nullable),
`estimated_days_min`, `estimated_days_max`, `is_active`, `sort_order`.
Index `(tenant_id, storefront_id, sort_order)`.

**Invariant:** zones are evaluated in `sort_order`; the first match wins, and
a `catch_all` zone must exist or checkout can dead-end. Absence of a
catch-all is a configuration error surfaced in the storefront settings page,
not a silent checkout failure.

#### `product_reviews`
`tenant_id`, `storefront_id`, `product_id`, `customer_party_id` (nullable),
`sales_order_id` (nullable — set = verified purchase),
`reviewer_name`, `rating` (1–5), `title` (nullable), `body`,
`status` (`pending` `approved` `rejected` `spam`),
`moderated_by` (nullable), `moderated_at` (nullable),
`helpful_count`.
Index `(tenant_id, product_id, status)`.

**Invariant:** reviews are `pending` by default. Auto-publishing user content
is not a default this system ships with.

#### `wishlists`
`tenant_id`, `storefront_id`, `customer_party_id`, `product_id`,
`variant_id` (nullable), `added_at`.
Unique `(tenant_id, customer_party_id, product_id, variant_id)`.

---

### 13.3 System & platform tables

#### `settings`
`tenant_id` (nullable — NULL = platform default), `scope`
(`platform` `tenant` `company` `branch` `user`), `scope_id` (nullable),
`group` (`general` `production` `inventory` `sales` `pos` `delivery`
`hr` `finance` `notifications` `security` `ecommerce`),
`key`, `value` (json), `value_type` (`string` `number` `boolean` `json`
`date`), `is_encrypted` (tinyint), `updated_by`.
Unique `(tenant_id, scope, scope_id, group, key)`.

**Correction (2026-08-23, found while implementing Wave 1).** That unique key
cannot be implemented literally. `tenant_id` and `scope_id` are both nullable,
and on MySQL 8 and SQLite alike a `NULL` never equals another `NULL` inside a
UNIQUE index — so `(NULL, 'platform', NULL, 'general', 'x')` is insertable an
unlimited number of times. The platform-default row, which the resolution order
below depends on as its final fallback, would be the *least* protected row in
the table.

Uniqueness is therefore enforced over two **stored generated columns** that fold
`NULL` to the sentinel `0`, while the semantic columns stay nullable exactly as
documented above:

```sql
tenant_key BIGINT UNSIGNED AS (COALESCE(tenant_id, 0)) STORED
scope_key  BIGINT UNSIGNED AS (COALESCE(scope_id, 0))  STORED
UNIQUE KEY uq_settings_scope_key (tenant_key, scope, scope_key, `group`, `key`)
```

The database computes them, so they cannot drift from their source columns, and
no application code may write them. Queries and foreign keys continue to use
`tenant_id` / `scope_id`. `feature_flags` below carries the same correction for
the same reason.


**Resolution order (most specific wins):**

```
user → branch → company → tenant → platform default
```

**Invariant:** a missing setting resolves to the **platform default**, never
to `null` at the call site. `Settings::get()` always returns a typed value.

**Invariant:** secrets (courier API keys, SMTP passwords, payment gateway
keys) are stored with `is_encrypted = 1` and are **never** returned by any
read API — the API returns a masked presence indicator only
(ARCHITECTURE §6.5).

#### `feature_flags`
`tenant_id` (nullable — NULL = global), `key`, `enabled` (tinyint),
`rollout_percentage` (nullable), `conditions` (json), `description`,
`updated_by`.
Unique `(tenant_id, key)` — implemented as `(tenant_key, key)` per the
`settings` correction above, because the global row has `tenant_id IS NULL`.

**Design note:** flags gate **incomplete work**, not business options. A
business option belongs in `settings`. Flags are expected to be short-lived
and are reviewed at every phase exit gate.

#### `webhook_endpoints`
`tenant_id`, `url`, `secret` (encrypted), `events` (json),
`is_active`, `last_success_at` (nullable), `last_failure_at` (nullable),
`consecutive_failures`, `disabled_reason` (nullable).

**Invariant:** after N consecutive failures the endpoint is auto-disabled with
a `disabled_reason` and a notification — it does not retry forever.

#### `webhook_deliveries`
`tenant_id`, `webhook_endpoint_id`, `event_type`, `payload` (json),
`attempt_count`, `response_status` (nullable), `response_body` (truncated),
`status` (`pending` `delivered` `failed` `abandoned`),
`next_retry_at` (nullable), `delivered_at` (nullable).
Index `(tenant_id, status, next_retry_at)`.

#### `imports`
`tenant_id`, `import_type` (`products` `parties` `employees` `opening_stock`
`price_list` `attendance`), `file_path`, `original_filename`,
`total_rows`, `processed_rows`, `success_rows`, `failed_rows`,
`status` (`uploaded` `validating` `validated` `importing` `completed`
`completed_with_errors` `failed` `cancelled`),
`error_report_path` (nullable), `mapping` (json),
`dry_run` (tinyint), `requested_by`, `started_at`, `finished_at`.

**Invariant:** every import supports `dry_run = 1` producing a full validation
report **without writing a single row**. An import with no dry-run path is
incomplete.

#### `jobs`, `job_batches`, `failed_jobs`
Standard Laravel queue tables, **unmodified** — no `tenant_id`. Tenant
context travels inside the serialised job payload and is re-established by
the job's own `withTenant()` bootstrap (ARCHITECTURE §3.2). Adding
`tenant_id` to these tables would fight the framework and break `queue:retry`.

**Invariant:** every queued job records the `tenant_id` and `correlation_id`
it was dispatched with, so a failed job can be traced back to the request
that created it.

#### `cache`, `cache_locks`, `sessions`
Standard Laravel tables. Cache **keys** are tenant-prefixed
(`t{tenant_id}:...`) so a cache read can never cross a tenant boundary
(ARCHITECTURE §3.1, enforcement layer 5).

#### `personal_access_tokens`
Standard Sanctum table, retained for **machine-to-machine** integrations
only (courier callbacks, ERP sync). Interactive user sessions use the
JWT + refresh-token family in §3, **not** this table (DECISIONS ADR-004).

#### `activity_snapshots`
`tenant_id`, `snapshot_date`, `active_users`, `orders_created`,
`invoices_posted`, `batches_closed`, `deliveries_completed`,
`api_requests`, `storage_bytes`.
Unique `(tenant_id, snapshot_date)`.

**Purpose:** feeds `tenant_usage_counters` (§2) for plan-limit enforcement
and platform-level tenant health, without querying every tenant's
transactional tables.

`snapshot_date` names the **tenant's** local day, not a UTC one, because the
limit being enforced is the tenant's trading day and a UTC bucket would split it
across two rows. The consequence belongs here rather than in a report that
rediscovers it: rows sharing one `snapshot_date` across different tenants do not
describe the same wall-clock interval, so a platform-wide cross-tenant sum for a
single date is an approximation and must be labelled as one.

This is a **cache** in §18's sense and the one Wave 4 table that is deliberately
recomputable: every row can be rebuilt from source, so a backfill is an upsert
onto the unique key rather than a second row. That is why it carries
`updated_at` and `audit_logs` does not — a snapshot row is arithmetic and must be
rewritable, an audit row is evidence and must not be.

---

## 14. Relationship summary

The full ERD is not reproduced as an image; these are the **load-bearing**
relationships. Everything else is a conventional FK.

### 14.1 The tenancy spine

```
tenants ─┬─▶ companies ──▶ branches ──┬─▶ warehouses ──▶ warehouse_locations
         │                            └─▶ pos_terminals
         ├─▶ factories ──▶ production_lines
         ├─▶ users ──▶ role_user ──▶ roles ──▶ role_permission ──▶ permissions
         │      └─▶ user_scopes  (branch / warehouse / factory sub-scoping)
         └─▶ tenant_subscriptions ──▶ plans
```

Every table in Groups B–L carries `tenant_id` and hangs off this spine.
`permissions` is the single global exception (§3).

### 14.2 The production chain

```
production_plans ──▶ production_plan_items
        │
        ▼
production_batches ──┬─▶ production_batch_inputs      (total input)
                     ├─▶ material_issues ──▶ material_issue_items
                     ├─▶ worker_production_entries ──▶ employees
                     ├─▶ production_outputs
                     ├─▶ qc_inspections ──▶ qc_inspection_results ──▶ qc_parameters
                     │                  └─▶ qc_defects
                     ├─▶ wastage_records ──▶ reason_codes
                     ├─▶ rework_orders
                     └─▶ production_cost_allocations
```

`production_batches.context_completeness` gates the yield and variance
columns, and gates `summary_daily_production`.

### 14.3 The inventory ledger

Every one of these writes `stock_movements`, and **nothing else** writes it:

```
goods_receipts          ─┐
material_issues         ─┤
production_outputs      ─┤
wastage_records         ─┤
stock_transfers         ─┼─▶ stock_movements ─┬─▶ stock_balances   (cache)
stock_adjustments       ─┤   (append-only)    └─▶ stock_reservations
stock_counts            ─┤
invoices / sales_returns─┤
maintenance_orders      ─┤
purchase_returns        ─┘
```

### 14.4 The order-to-cash chain

```
crm_leads ──▶ parties ──▶ sales_orders ──┬─▶ sales_order_items
                              │          ├─▶ stock_reservations
                              │          └─▶ sales_order_payments
                              ▼
                          invoices ──┬─▶ invoice_items
                              │      └─▶ payment_allocations ──▶ payments
                              ▼
                       delivery_orders ──┬─▶ delivery_order_items
                              │          ├─▶ delivery_status_events
                              │          ├─▶ run_sheets
                              │          └─▶ courier_shipments ──▶ courier_providers
                              ▼                        ▲
                       cod_reconciliations      courier_webhook_events
```

`sales_orders.channel` discriminates counter / dealer / phone / field /
online. `carts.converted_sales_order_id` is the only e-commerce entry point
into this chain.

### 14.5 Deliberate polymorphic pairs

Polymorphism is used sparingly and always as an **explicit
`*_type` + `*_id` pair with a closed vocabulary**, never Laravel's implicit
`morphTo` across the whole codebase:

| Table | Pair | Allowed types |
|---|---|---|
| `stock_movements` | `reference_type` / `reference_id` | 15 document types (§6) |
| `attachments` | `attachable_type` / `attachable_id` | product, party, employee, expense, batch, delivery, asset |
| `audit_logs` | `auditable_type` / `auditable_id` | any model (append-only) |
| `payment_allocations` | `allocatable_type` / `allocatable_id` | invoice, purchase_bill |
| `asset_assignments` | `assigned_to_type` / `assigned_to_id` | employee, branch, factory, production_line, vehicle |
| `expenses` | `related_reference_type` / `related_reference_id` | delivery, maintenance, batch, run_sheet |

**Rule:** each pair is indexed `(tenant_id, *_type, *_id)`. An un-indexed
polymorphic pair is a defect.

---

## 15. Table inventory

| Group | Domain | Tables | Phase |
|---|---|---:|---|
| A | Platform & tenancy | 8 | 1 |
| B | Identity, access & audit | 13 | 1 |
| C | Master data | 21 | 2 |
| D | Production & QC | 15 | 3 |
| E | Inventory (ledger) | 9 | 3–4 |
| F | Purchasing | 10 | 4 |
| G | Sales, POS & invoicing | 14 | 5 |
| H | Delivery & couriers | 8 | 6 |
| I | HR, attendance & payroll | 16 | 3 (slice) / 7 |
| J | Assets & maintenance | 8 | 7 |
| K | Finance & costing | 11 | 7 |
| L | Reporting, e-commerce & system | 26 | 8–9 |
| | **Total** | **159** | |

Of these, **6** carry no `tenant_id`: `permissions`, `jobs`, `job_batches`,
`failed_jobs`, `cache`, `cache_locks`. Every other table is tenant-scoped and
must use `BelongsToTenant` (ARCHITECTURE §3.1).

**Rule:** this count is an outcome, not a target. A table is added when a
documented invariant requires it, and removed when it does not. Any change to
this table requires a `DECISIONS.md` entry.

---

## 16. Migration ordering

Migrations are named `YYYY_MM_DD_HHMMSS_<verb>_<table>_table.php` and are
grouped into **numbered waves**. A wave may only reference tables from an
earlier wave or its own.

```
Wave 0  framework      users(stub), cache, jobs, sessions,
                       personal_access_tokens, failed_jobs
Wave 1  platform       tenants, plans, tenant_subscriptions,
                       tenant_usage_counters, settings, feature_flags
Wave 2  org            companies, branches, factories, production_lines
Wave 3  identity       users(finalise: tenant_id, perm_version),
                       permissions, roles, role_permission, role_user,
                       user_scopes, refresh_tokens
Wave 4  infra          audit_logs, idempotency_keys, attachments,
                       notifications, notification_preferences,
                       document_sequences, activity_snapshots
Wave 5  master A       units, unit_conversions, categories, brands,
                       tax_profiles, reason_codes
Wave 6  master B       products, product_variants, product_images,
                       bill_of_materials, bill_of_material_items
Wave 7  master C       warehouses, warehouse_locations, parties,
                       party_addresses, party_contacts, price_lists,
                       price_list_items, discount_rules
Wave 8  hr identity    departments, designations, employees, shifts
Wave 9  fk closure     departments.head_employee_id,
                       employees.reports_to_employee_id,
                       employees.default_shift_id
Wave 10 production     production_plans, production_plan_items,
                       production_batches, production_batch_inputs,
                       material_issues, material_issue_items,
                       worker_production_entries, production_outputs
Wave 11 qc             qc_parameters, qc_inspections,
                       qc_inspection_results, qc_defects,
                       wastage_records, rework_orders
Wave 12 ledger         stock_movements, stock_balances,
                       stock_reservations
Wave 13 stock ops      stock_transfers(+items), stock_adjustments(+items),
                       stock_counts(+items)
Wave 14 purchasing     purchase_requisitions(+items),
                       purchase_orders(+items), goods_receipts(+items),
                       purchase_bills(+items), purchase_returns(+items)
Wave 15 sales          crm_leads, crm_activities, sales_orders(+items),
                       invoice_templates, invoices(+items),
                       sales_returns(+items)
Wave 16 payments       payments, payment_allocations,
                       sales_order_payments
Wave 17 pos            pos_terminals, pos_sessions, pos_offline_queue
Wave 18 delivery       delivery_orders(+items), delivery_status_events,
                       run_sheets, courier_providers, courier_shipments,
                       courier_webhook_events, cod_reconciliations
Wave 19 hr full        shift_assignments, attendances, leave_types,
                       leave_balances, leave_requests, holidays,
                       employee_documents, salary_components,
                       salary_structures, salary_structure_components,
                       payroll_periods, payslips, payslip_items,
                       payroll_advances
Wave 20 assets         asset_categories, assets, asset_assignments,
                       asset_depreciation_entries, maintenance_schedules,
                       maintenance_orders, maintenance_order_parts,
                       asset_meter_readings
Wave 21 finance        chart_of_accounts, journal_entries, journal_lines,
                       expense_categories, expenses, bank_accounts,
                       bank_transactions, payment_terms,
                       party_credit_limits, product_costs,
                       production_cost_allocations
Wave 22 reporting      report_definitions, report_saved_views,
                       report_schedules, report_exports,
                       dashboard_widgets, summary_* (9 tables)
Wave 23 ecommerce      storefronts, storefront_pages, storefront_products,
                       carts, cart_items, coupons, coupon_redemptions,
                       shipping_zones, product_reviews, wishlists
Wave 24 integrations   webhook_endpoints, webhook_deliveries, imports
Wave 25 fk closure 2   deferred cross-group FKs
                       (journal_entry_id on expenses / depreciation,
                        payroll_period_id on attendances and
                        worker_production_entries,
                        stock_movement_id on maintenance_order_parts,
                        converted_sales_order_id on carts)
```

### 16.1 Rules

0. **Wave 0 required no work.** Laravel's three default migrations already
   create `users` (stub), `cache`, `cache_locks`, `jobs`, `job_batches`,
   `failed_jobs`, `sessions` and `password_reset_tokens`. Only
   `personal_access_tokens` is missing, and it is Sanctum's table — ADR-007
   uses JWT plus a rotating refresh-token family (`refresh_tokens`, Wave 3),
   so it is never created. The first migration this project writes is
   therefore **Wave 1**.
1. **`users` is created twice.** Wave 0 creates the framework stub so auth
   scaffolding boots; Wave 3 adds `tenant_id`, `perm_version` and the tenant
   FK. This is the only table permitted a two-step creation, because
   `tenants` cannot exist before the framework tables.
2. **Circular FKs are resolved in a closure wave** (9 and 25), never by
   dropping the constraint. A nullable FK added later is correct; a missing
   FK is not.

   **Deferred keys owed by an earlier wave to a later one.** A wave may only
   reference tables from an earlier wave or its own, so a forward reference
   cannot be declared where its column is created. Waves 9 and 25 cover
   *circular* pairs; a plain forward reference has no closure wave, and unless
   it is recorded here it is simply forgotten. The column is created nullable
   and unconstrained, its index is created with it (rule 5, so no `ALTER` on a
   populated table later), and the wave that creates the *target* adds the key:

   | Column | Created in | Target | Key added in |
   |---|---|---|---|
   | `production_lines.capacity_unit_id` | Wave 2 | `units` | **Wave 5** |

   Each entry is also pinned by a test in the owning wave's schema contract
   that fails once the target table appears, so the obligation surfaces in the
   suite and not only in this table.
3. **No migration writes data.** Reference data belongs in seeders (§17).
   An `INSERT` inside a migration is a defect.
4. **No `down()` that loses data in production.** `down()` exists for local
   development. Production rolls **forward** with a corrective migration.
5. **Index migrations are separate** from table creation when added later, so
   a slow `ALTER` on a large tenant table can be scheduled independently.
6. **Every migration is reversible in a fresh SQLite database**, because the
   test suite runs `migrate:fresh` on SQLite (ARCHITECTURE §7).

---

## 17. Seeding policy

Seeders are split into three classes with different rules.

### 17.1 System seeders — always run, every environment

| Seeder | Contents |
|---|---|
| `PermissionSeeder` | The full closed permission list from MODULE_MAP §6 |
| `PlanSeeder` | Platform plan definitions and limits |
| `PlatformSettingSeeder` | Every `settings` key with its platform default |
| `ReportDefinitionSeeder` | Platform report definitions (RMS registry) |
| `SystemAccountSeeder` | `is_system = 1` chart-of-accounts rows |

**Invariant:** these are **idempotent upserts** keyed on the natural key.
Re-running must never duplicate a row and never destroy a tenant's override.

**Invariant:** `PermissionSeeder` is the **only** writer of `permissions`.
When a module adds a permission it is added to the seeder and the seeder is
re-run; permissions are never created ad hoc at runtime.

### 17.2 Tenant provisioning seeders — run once per new tenant

Executed by the tenant-provisioning action, not by `db:seed`:

```
CreateTenant
  ├─ create tenant row + subscription
  ├─ create default company + branch
  ├─ seed system roles (Owner, Admin, Manager, Operator, Viewer)
  ├─ attach permission sets to those roles
  ├─ create the owner user
  ├─ seed default units, default tax profile, default warehouse
  ├─ seed document_sequences for every document type
  └─ seed tenant setting overrides (currency, locale, timezone)
```

**Invariant:** a freshly provisioned tenant must be able to complete a full
production → sale → delivery cycle **without a developer touching the
database**. If provisioning misses a row that blocks a flow, that is a
provisioning defect, not a data-entry task.

### 17.3 Demo seeders — development and demo only

| Seeder | Guard |
|---|---|
| `DemoTenantSeeder` | Refuses to run when `app.env === 'production'` |

**Hard rules:**

1. The demo tenant is named from **configuration**, never hardcoded. There is
   no `'Slice Mart'` string literal in any seeder. Slice Mart is tenant #1 of
   a multi-tenant product, and a seeder that assumes it has already broken the
   product's core premise (PROJECT_CONTEXT §1).
2. Demo data is **generated through the same Actions** the UI uses — a demo
   batch is closed by `CloseProductionBatch`, not by inserting rows. This
   makes the demo data automatically obey every invariant in this document,
   and it turns the seeder into a smoke test.
3. Demo data is **never** a substitute for tests, and **never** shipped to a
   real tenant.
4. `mockData.ts` and every other front-end fixture file is **deleted**, not
   ported (PROJECT_CONTEXT §10). Fake data in the UI layer is forbidden by
   DECISIONS ADR-022.

---

## 18. Data integrity checklist

Before any migration is merged, all of the following must hold. This is the
database half of the Definition of Done (MODULE_MAP §5).

- [ ] `tenant_id` is present, `NOT NULL`, indexed, and first after `id` —
      or the table is one of the 6 documented exceptions (§15).
- [ ] Every unique key that represents a business rule is **tenant-scoped**.
- [ ] Every FK has an explicit `onDelete` — `RESTRICT` unless documented.
- [ ] Money and quantity columns are `DECIMAL(18,4)`. No `FLOAT`, no
      `DOUBLE`, no money in `INT` paisa.
- [ ] Status and type columns are `VARCHAR(32)` with the vocabulary
      documented here — never MySQL `ENUM`.
- [ ] Derived columns (`stock_balances.quantity`, `book_value`,
      `balance_days`, `current_balance`, `paid_amount`) are documented as
      caches and are only written inside their owning transaction.
- [ ] Columns that must be unknown are **nullable with no default** —
      specifically `production_batches.yield_percentage`,
      `variance_quantity`, `variance_percentage`. A default of `0` is a
      defect (§5).
- [ ] Append-only tables (`stock_movements`, `audit_logs`,
      `delivery_status_events`, `asset_depreciation_entries`,
      `bank_transactions`, `journal_entries` once posted) have no update or
      delete path in application code.
- [ ] Snapshot columns (`product_name`, `component_code`, `payee_name`,
      tax and price snapshots) are populated at write time, not resolved at
      read time.
- [ ] Every polymorphic pair is indexed `(tenant_id, *_type, *_id)`.
- [ ] The migration runs clean on **both** MySQL 8 and SQLite.
- [ ] `migrate:fresh --seed` produces a working tenant.

---

## 19. Open questions

Carried from `DECISIONS.md` §7. These are the only schema questions
deliberately left unresolved; nothing else may be improvised.

| # | Question | Impact | Provisional stance |
|---|---|---|---|
| Q3 | Is invoice numbering scoped per company or per branch? | `invoices` unique key | Per company; revisit before Phase 5 exit |
| Q5 | Is FIFO costing required in v1? | `product_costs` layer tables | No — weighted average only |
| Q6 | Is batch/lot traceability required end-to-end at launch? | `stock_movements.batch_number` propagation into `invoice_items` | Captured but not enforced end-to-end |

**Rule:** an open question is answered in `DECISIONS.md` **first**, then
reflected here. Answering it in a migration is a process violation.

---

## 20. Change log

| Date | Change | Author |
|---|---|---|
| 2026-08-22 | Initial canonical data model. Groups A–L, 159 tables, migration waves 0–25, seeding policy, integrity checklist. Supersedes `docs/_legacy/DATABASE_SCHEMA.md` in full. | Architecture |

