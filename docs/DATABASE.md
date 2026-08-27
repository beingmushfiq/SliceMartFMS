# AUTHORITATIVE DATABASE ARCHITECTURE & SCHEMA REFERENCE

> **Status:** Canonical Database Reference.
> **Engine:** MySQL 8.0+ (Production) / SQLite 3 in-memory (Unit/Feature Testing).
> **Migration Coverage:** 169 tables across 170 migration files in 25 waves.
> **Last updated:** 2026-08-27

---

## 1. Database Principles & Conventions

1. **Shared Schema Multi-Tenancy (ADR-004):**
   * Every tenant-owned table carries a `tenant_id` (`BIGINT UNSIGNED NOT NULL`) column.
   * Foreign keys and composite unique constraints always include `tenant_id` to enforce physical row isolation at the database level.
2. **Numeric Precision (ADR-009):**
   * Monetary amounts and inventory quantities are strictly `DECIMAL(18,4)`.
   * Floating-point data types (`FLOAT`, `DOUBLE`) are strictly forbidden.
3. **Primary & Unique Keys:**
   * Internal Primary Key: `id` (`BIGINT UNSIGNED AUTO_INCREMENT`).
   * External / API Resource Identifier: `uuid` (`CHAR(36)` or `VARCHAR(36)` indexed).
   * Natural Tenant Uniqueness: `UNIQUE (tenant_id, code)` or `UNIQUE (tenant_id, name)`.
4. **Append-Only Ledgers & Rebuildable Caches (ADR-013, ADR-014):**
   * `stock_movements` and `journal_lines` are append-only.
   * `stock_balances` and `party.current_balance` are read-performance caches rebuildable at any time.

---

## 2. Table Registry by Domain Group

### Group A: Platform & Multi-Tenancy (Wave 1)
* **`plans`**: Subscription tiers (`id`, `uuid`, `code`, `name`, `price`, `billing_interval`, `limits_json`, `is_active`).
* **`tenants`**: Tenant boundary (`id`, `uuid`, `code`, `name`, `domain`, `status`, `plan_id`, `timezone`, `currency`, `created_at`).
* **`tenant_subscriptions`**: Active billing cycles and trial windows (`id`, `tenant_id`, `plan_id`, `starts_at`, `ends_at`, `status`).
* **`tenant_usage_counters`**: Real-time quota metrics (`id`, `tenant_id`, `metric`, `value`, `period_start`).
* **`settings`**: Tenant configuration key-value store (`id`, `tenant_id`, `key`, `value_json`, `is_public`).
* **`feature_flags`**: Granular feature enablement (`id`, `tenant_id`, `flag`, `is_enabled`).

### Group B: Organization Hierarchy (Wave 2)
* **`companies`**: Legal tax entities (`id`, `tenant_id`, `uuid`, `code`, `name`, `tax_number`, `currency`).
* **`branches`**: Physical commercial/retail branches (`id`, `tenant_id`, `company_id`, `uuid`, `code`, `name`, `is_active`).
* **`factories`**: Manufacturing plants (`id`, `tenant_id`, `branch_id`, `uuid`, `code`, `name`, `location`).
* **`production_lines`**: Discrete production lines (`id`, `tenant_id`, `factory_id`, `uuid`, `code`, `name`, `capacity_per_hour`, `capacity_unit_id`).

### Group C: Identity, Authentication & RBAC (Wave 3)
* **`users`**: Platform and tenant accounts (`id`, `tenant_id`, `uuid`, `name`, `email`, `password`, `is_active`, `is_super_admin`).
* **`permissions`**: Fine-grained permissions catalogue (`id`, `name`, `domain`, `resource`, `action`, `description`).
* **`roles`**: Tenant-defined user roles (`id`, `tenant_id`, `uuid`, `name`, `is_system`).
* **`role_permission`**: Role permission mapping (`role_id`, `permission_id`).
* **`role_user`**: User role assignments (`user_id`, `role_id`, `tenant_id`).
* **`user_scopes`**: Branch/factory facility restrictions (`id`, `tenant_id`, `user_id`, `scope_type`, `scope_id`).
* **`refresh_tokens`**: Rotating session tokens (`id`, `tenant_id`, `user_id`, `token_hash`, `family_id`, `is_revoked`, `expires_at`).

### Group D: System Infrastructure & Audit (Wave 4)
* **`audit_logs`**: System audit trail (`id`, `tenant_id`, `user_id`, `action`, `auditable_type`, `auditable_id`, `old_values`, `new_values`, `ip_address`, `correlation_id`).
* **`idempotency_keys`**: Request idempotency locks (`id`, `tenant_id`, `key`, `request_hash`, `response_code`, `response_body`, `expires_at`).
* **`attachments`**: Uploaded file metadata (`id`, `tenant_id`, `attachable_type`, `attachable_id`, `file_path`, `file_size`, `mime_type`).
* **`notifications`**: User notification queue (`id`, `tenant_id`, `user_id`, `type`, `data_json`, `read_at`).
* **`notification_preferences`**: User channel preferences (`id`, `tenant_id`, `user_id`, `event_type`, `channels_json`).
* **`document_sequences`**: Sequential numbering generator (`id`, `tenant_id`, `entity_type`, `prefix`, `current_number`, `year`).
* **`activity_snapshots`**: Periodic entity state snapshots (`id`, `tenant_id`, `snapshot_type`, `entity_id`, `payload_json`).

### Group E: Master Data — Units, Taxonomy & Catalogue (Waves 5–7)
* **`units`**: Measurement units (`id`, `tenant_id`, `uuid`, `code`, `name`, `symbol`, `is_base`).
* **`unit_conversions`**: Conversion rules (`id`, `tenant_id`, `from_unit_id`, `to_unit_id`, `multiplier`).
* **`categories`**: Product taxonomy tree (`id`, `tenant_id`, `uuid`, `parent_id`, `code`, `name`).
* **`brands`**: Product brands (`id`, `tenant_id`, `uuid`, `code`, `name`).
* **`tax_profiles`**: Tax rates (`id`, `tenant_id`, `uuid`, `code`, `name`, `rate_percentage`).
* **`reason_codes`**: Adjustment and scrap reasons (`id`, `tenant_id`, `uuid`, `code`, `name`, `category`).
* **`products`**: Master product catalog (`id`, `tenant_id`, `uuid`, `code`, `name`, `type`, `category_id`, `brand_id`, `base_unit_id`, `tax_profile_id`, `min_stock_level`, `max_stock_level`, `is_active`).
* **`product_variants`**: Product variant SKUs (`id`, `tenant_id`, `product_id`, `uuid`, `sku`, `name`, `attributes_json`, `barcode`).
* **`product_images`**: Product gallery assets (`id`, `tenant_id`, `product_id`, `file_path`, `is_primary`, `sort_order`).
* **`bill_of_materials`**: Manufacturing recipes (`id`, `tenant_id`, `product_id`, `uuid`, `version`, `is_active`, `batch_size`, `batch_unit_id`).
* **`bill_of_material_items`**: Recipe ingredients (`id`, `tenant_id`, `bom_id`, `ingredient_id`, `quantity`, `unit_id`, `loss_percentage`).
* **`warehouses`**: Storage locations (`id`, `tenant_id`, `branch_id`, `uuid`, `code`, `name`, `type`, `is_active`).
* **`warehouse_locations`**: Bin/rack locations (`id`, `tenant_id`, `warehouse_id`, `uuid`, `code`, `aisle`, `rack`, `shelf`, `bin`).
* **`parties`**: Customers, suppliers, dealers, agents (`id`, `tenant_id`, `uuid`, `code`, `name`, `is_supplier`, `is_customer`, `is_dealer`, `is_agent`, `credit_limit`, `credit_days`, `opening_balance`, `current_balance`).
* **`party_addresses`**: Structured party locations (`id`, `tenant_id`, `party_id`, `type`, `address_line1`, `city`, `postal_code`).
* **`party_contacts`**: Party contact persons (`id`, `tenant_id`, `party_id`, `name`, `phone`, `email`, `role`).
* **`price_lists`**: Custom price schedules (`id`, `tenant_id`, `uuid`, `code`, `name`, `currency`, `is_default`).
* **`price_list_items`**: Price rules per variant (`id`, `tenant_id`, `price_list_id`, `product_variant_id`, `price`).
* **`discount_rules`**: Tiered discount schedules (`id`, `tenant_id`, `uuid`, `code`, `name`, `min_quantity`, `discount_percentage`).

### Group F: Production Execution & QC (Waves 10–11)
* **`production_plans`**: High-level schedules (`id`, `tenant_id`, `uuid`, `code`, `start_date`, `end_date`, `status`).
* **`production_plan_items`**: Planned quantities per product (`id`, `tenant_id`, `plan_id`, `product_id`, `planned_quantity`).
* **`production_batches`**: Manufacturing batches (`id`, `tenant_id`, `factory_id`, `production_line_id`, `product_id`, `bom_id`, `uuid`, `batch_number`, `planned_quantity`, `status`, `context_completeness`, `start_time`, `end_time`).
* **`material_issues`**: Warehouse to line dispatches (`id`, `tenant_id`, `batch_id`, `warehouse_id`, `uuid`, `issue_number`, `status`).
* **`material_issue_items`**: Issued stock items (`id`, `tenant_id`, `material_issue_id`, `product_id`, `quantity`, `unit_id`).
* **`production_batch_inputs`**: Total physical material consumed (`id`, `tenant_id`, `batch_id`, `product_id`, `quantity`, `unit_id`, `recorded_by`).
* **`worker_production_entries`**: Floor worker output logging (`id`, `tenant_id`, `batch_id`, `worker_id`, `product_variant_id`, `quantity_produced`, `weight_produced`, `logged_at`).
* **`production_outputs`**: Final output reconciliation (`id`, `tenant_id`, `batch_id`, `product_id`, `total_passed`, `total_rework`, `total_scrapped`, `total_wastage`, `calculated_yield`).
* **`qc_parameters`**: Inspection criteria (`id`, `tenant_id`, `product_id`, `name`, `target_value`, `tolerance`).
* **`qc_inspections`**: Quality audit sessions (`id`, `tenant_id`, `batch_id`, `inspector_id`, `result_status`, `inspected_at`).
* **`qc_inspection_results`**: Parameter test measurements (`id`, `tenant_id`, `inspection_id`, `parameter_id`, `measured_value`, `is_pass`).
* **`qc_defects`**: Categorized defect logs (`id`, `tenant_id`, `inspection_id`, `defect_type`, `quantity`, `action_taken`).
* **`wastage_records`**: Unrecoverable losses (`id`, `tenant_id`, `batch_id`, `product_id`, `quantity`, `reason_code_id`).
* **`rework_orders`**: Reprocessing instructions (`id`, `tenant_id`, `batch_id`, `target_batch_id`, `quantity`, `status`).

### Group G: Stock Ledger & Inventory Operations (Waves 12–13)
* **`stock_movements`**: Immutable append-only ledger (`id`, `tenant_id`, `product_variant_id`, `warehouse_id`, `location_id`, `movement_type`, `quantity`, `balance_after`, `reference_type`, `reference_id`, `actor_id`, `created_at`).
* **`stock_balances`**: Performance balance cache (`id`, `tenant_id`, `product_variant_id`, `warehouse_id`, `location_id`, `available_qty`, `reserved_qty`, `in_transit_qty`, `quarantine_qty`, `damaged_qty`, `updated_at`).
* **`stock_reservations`**: Allocated stock reservations (`id`, `tenant_id`, `product_variant_id`, `warehouse_id`, `reserved_qty`, `reference_type`, `reference_id`, `expires_at`).
* **`stock_transfers`**: Inter-warehouse transfers (`id`, `tenant_id`, `from_warehouse_id`, `to_warehouse_id`, `status`, `transfer_number`).
* **`stock_transfer_items`**: Transferred items (`id`, `tenant_id`, `transfer_id`, `product_variant_id`, `quantity`).
* **`stock_adjustments`**: Manual write-offs/corrections (`id`, `tenant_id`, `warehouse_id`, `reason_code_id`, `adjustment_number`, `status`).
* **`stock_adjustment_items`**: Adjusted items (`id`, `tenant_id`, `adjustment_id`, `product_variant_id`, `quantity_delta`).
* **`stock_counts`**: Physical count sheets (`id`, `tenant_id`, `warehouse_id`, `count_number`, `status`).
* **`stock_count_items`**: Physical vs book reconciliation (`id`, `tenant_id`, `stock_count_id`, `product_variant_id`, `system_qty`, `counted_qty`, `variance_qty`).

### Group H: Procurement Chain (Wave 14)
* **`purchase_requisitions`**: Internal purchase requests (`id`, `tenant_id`, `requester_id`, `code`, `status`).
* **`purchase_requisition_items`**: Requisition line items (`id`, `tenant_id`, `requisition_id`, `product_id`, `quantity`).
* **`purchase_orders`**: Supplier purchase orders (`id`, `tenant_id`, `supplier_id`, `po_number`, `total_amount`, `status`).
* **`purchase_order_items`**: PO line items (`id`, `tenant_id`, `purchase_order_id`, `product_id`, `quantity`, `unit_price`, `tax_amount`).
* **`goods_receipts`**: Warehouse receiving documents (`id`, `tenant_id`, `purchase_order_id`, `warehouse_id`, `grn_number`, `status`).
* **`goods_receipt_items`**: Received line items (`id`, `tenant_id`, `goods_receipt_id`, `product_id`, `received_qty`, `accepted_qty`, `rejected_qty`).
* **`purchase_bills`**: Accounts payable invoices (`id`, `tenant_id`, `goods_receipt_id`, `supplier_id`, `bill_number`, `total_amount`, `status`).
* **`purchase_bill_items`**: Bill line items (`id`, `tenant_id`, `purchase_bill_id`, `product_id`, `amount`).
* **`purchase_returns`**: Goods returned to vendor (`id`, `tenant_id`, `supplier_id`, `return_number`, `status`).
* **`purchase_return_items`**: Returned items (`id`, `tenant_id`, `purchase_return_id`, `product_id`, `quantity`).

### Group I: CRM, Sales & POS (Waves 15–17)
* **`crm_leads`**: Prospective customers (`id`, `tenant_id`, `name`, `company_name`, `phone`, `status`, `assigned_to`).
* **`crm_activities`**: Sales touchpoints (`id`, `tenant_id`, `lead_id`, `activity_type`, `notes`, `performed_at`).
* **`sales_orders`**: Customer orders across all channels (`id`, `tenant_id`, `customer_id`, `branch_id`, `order_number`, `channel`, `total_amount`, `tax_amount`, `discount_amount`, `status`, `payment_status`).
* **`sales_order_items`**: Order line items (`id`, `tenant_id`, `sales_order_id`, `product_variant_id`, `quantity`, `unit_price`, `total_price`).
* **`invoice_templates`**: Tenant-branded layout designs (`id`, `tenant_id`, `name`, `layout_json`, `is_default`).
* **`invoices`**: Commercial invoices (`id`, `tenant_id`, `sales_order_id`, `customer_id`, `invoice_number`, `total_amount`, `status`).
* **`invoice_items`**: Invoiced items (`id`, `tenant_id`, `invoice_id`, `product_variant_id`, `quantity`, `unit_price`, `line_total`).
* **`sales_returns`**: Customer return orders (`id`, `tenant_id`, `invoice_id`, `return_number`, `refund_amount`, `status`).
* **`sales_return_items`**: Returned items (`id`, `tenant_id`, `sales_return_id`, `product_variant_id`, `quantity`, `restock_warehouse_id`).
* **`payments`**: Accounts receivable receipts (`id`, `tenant_id`, `party_id`, `payment_number`, `amount`, `payment_method`, `reference_number`).
* **`payment_allocations`**: Multi-invoice allocations (`id`, `tenant_id`, `payment_id`, `invoice_id`, `allocated_amount`).
* **`sales_order_payments`**: Order downpayments (`id`, `tenant_id`, `sales_order_id`, `payment_id`).
* **`pos_terminals`**: Retail POS machines (`id`, `tenant_id`, `branch_id`, `terminal_code`, `name`, `is_active`).
* **`pos_sessions`**: Cash drawer shifts (`id`, `tenant_id`, `terminal_id`, `cashier_id`, `opening_cash`, `closing_cash`, `status`, `opened_at`, `closed_at`).
* **`pos_offline_queue`**: Offline cached sales queue (`id`, `tenant_id`, `terminal_id`, `payload_json`, `sync_status`).

### Group J: Logistics & Courier Integrations (Wave 18)
* **`courier_providers`**: External carrier registry (`id`, `tenant_id`, `code`, `name`, `api_credentials_json`, `capability_matrix_json`, `is_active`).
* **`run_sheets`**: Dispatch delivery manifests (`id`, `tenant_id`, `driver_id`, `run_sheet_number`, `status`, `dispatched_at`).
* **`delivery_orders`**: Individual delivery requests (`id`, `tenant_id`, `sales_order_id`, `run_sheet_id`, `courier_id`, `tracking_number`, `status`, `pod_signature_url`).
* **`delivery_order_items`**: Delivery line items (`id`, `tenant_id`, `delivery_order_id`, `sales_order_item_id`, `quantity`).
* **`delivery_status_events`**: Tracking history log (`id`, `tenant_id`, `delivery_order_id`, `status`, `notes`, `occurred_at`).
* **`courier_shipments`**: External carrier consignments (`id`, `tenant_id`, `delivery_order_id`, `courier_id`, `consignment_id`, `label_url`).
* **`courier_webhook_events`**: Inbound webhook payload logs (`id`, `tenant_id`, `courier_id`, `payload_json`, `processed_at`).
* **`cod_reconciliations`**: Cash-on-delivery settlements (`id`, `tenant_id`, `courier_id`, `settlement_number`, `collected_amount`, `charges`, `status`).

### Group K: Human Resources, Workforce & Payroll (Wave 19)
* **`departments`**: Organizational departments (`id`, `tenant_id`, `code`, `name`).
* **`designations`**: Job titles and ranks (`id`, `tenant_id`, `code`, `name`).
* **`shifts`**: Work shift schedules (`id`, `tenant_id`, `name`, `start_time`, `end_time`, `grace_minutes`).
* **`employees`**: Employee records (`id`, `tenant_id`, `uuid`, `code`, `name`, `department_id`, `designation_id`, `shift_id`, `base_salary`, `is_active`).
* **`leave_types`**: Leave categories (`id`, `tenant_id`, `code`, `name`, `days_allowed`).
* **`leave_requests`**: Employee leave applications (`id`, `tenant_id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `status`).
* **`leave_balances`**: Accrued leave tracking (`id`, `tenant_id`, `employee_id`, `leave_type_id`, `year`, `remaining_days`).
* **`shift_assignments`**: Shift rosters (`id`, `tenant_id`, `employee_id`, `shift_id`, `effective_date`).
* **`holidays`**: Public and company holidays (`id`, `tenant_id`, `name`, `date`).
* **`employee_documents`**: HR compliance files (`id`, `tenant_id`, `employee_id`, `document_type`, `file_path`).
* **`salary_components`**: Earning and deduction categories (`id`, `tenant_id`, `name`, `type`, `is_taxable`).
* **`salary_structures`**: Compensation packages (`id`, `tenant_id`, `name`).
* **`salary_structure_components`**: Component ratios (`id`, `tenant_id`, `structure_id`, `component_id`, `amount_or_percentage`).
* **`payroll_periods`**: Monthly payroll cycles (`id`, `tenant_id`, `month`, `year`, `status`, `locked_at`, `locked_by`).
* **`attendances`**: Daily attendance records (`id`, `tenant_id`, `employee_id`, `date`, `check_in`, `check_out`, `status`).
* **`payslips`**: Generated employee payslips (`id`, `tenant_id`, `payroll_period_id`, `employee_id`, `gross_salary`, `deductions`, `production_incentive`, `net_salary`, `status`).
* **`payslip_items`**: Payslip component details (`id`, `tenant_id`, `payslip_id`, `salary_component_id`, `amount`).
* **`payroll_advances`**: Salary loans and advance deductions (`id`, `tenant_id`, `employee_id`, `amount`, `recovered_amount`, `status`).

### Group L: Assets, Finance & Costing (Waves 20–21)
* **`asset_categories`**: Equipment categories (`id`, `tenant_id`, `name`, `depreciation_rate`).
* **`assets`**: Machinery and fixed assets (`id`, `tenant_id`, `factory_id`, `category_id`, `asset_code`, `name`, `purchase_cost`, `current_value`, `status`).
* **`asset_assignments`**: Asset custody logs (`id`, `tenant_id`, `asset_id`, `employee_id`, `assigned_at`, `returned_at`).
* **`asset_depreciation_entries`**: Depreciation log (`id`, `tenant_id`, `asset_id`, `date`, `depreciation_amount`, `book_value`).
* **`maintenance_schedules`**: Preventative upkeep plans (`id`, `tenant_id`, `asset_id`, `frequency_days`, `last_performed_at`).
* **`maintenance_orders`**: Repair work orders (`id`, `tenant_id`, `asset_id`, `order_number`, `cost`, `status`).
* **`maintenance_order_parts`**: Consumed spare parts (`id`, `tenant_id`, `maintenance_order_id`, `product_id`, `quantity`).
* **`asset_meter_readings`**: Usage hour meters (`id`, `tenant_id`, `asset_id`, `reading`, `recorded_at`).
* **`chart_of_accounts`**: Financial ledger accounts (`id`, `tenant_id`, `code`, `name`, `type`, `parent_id`).
* **`journal_entries`**: General journal headers (`id`, `tenant_id`, `entry_number`, `date`, `description`, `status`).
* **`journal_lines`**: Double-entry ledger rows (`id`, `tenant_id`, `journal_entry_id`, `account_id`, `debit_amount`, `credit_amount`).
* **`expense_categories`**: Overhead classifications (`id`, `tenant_id`, `name`).
* **`bank_accounts`**: Treasury and cash accounts (`id`, `tenant_id`, `account_name`, `account_number`, `current_balance`).
* **`expenses`**: Operating expense vouchers (`id`, `tenant_id`, `category_id`, `bank_account_id`, `amount`, `date`, `status`).
* **`bank_transactions`**: Bank feed transactions (`id`, `tenant_id`, `bank_account_id`, `transaction_date`, `amount`, `reference`).
* **`payment_terms`**: Credit duration terms (`id`, `tenant_id`, `name`, `due_days`).
* **`party_credit_limits`**: Over-credit overrides (`id`, `tenant_id`, `party_id`, `credit_limit`, `approved_by`).
* **`product_costs`**: Unit manufacturing cost records (`id`, `tenant_id`, `product_id`, `batch_id`, `material_cost`, `labour_cost`, `overhead_cost`, `total_unit_cost`).
* **`production_cost_allocations`**: Batch overhead splits (`id`, `tenant_id`, `batch_id`, `expense_id`, `allocated_amount`).

### Group M: Reporting & Rollup Summaries (Wave 22)
* **`report_definitions`**: System report catalog (`id`, `code`, `name`, `domain`, `query_template`).
* **`report_saved_views`**: User custom filters (`id`, `tenant_id`, `user_id`, `report_code`, `filter_json`).
* **`report_schedules`**: Automated email reports (`id`, `tenant_id`, `report_code`, `frequency`, `recipients_json`).
* **`report_exports`**: Background export jobs (`id`, `tenant_id`, `user_id`, `format`, `file_url`, `status`).
* **`dashboard_widgets`**: User widget preferences (`id`, `tenant_id`, `user_id`, `widget_key`, `layout_json`).
* **`summary_daily_production`**: Production daily rollup cache.
* **`summary_daily_worker_output`**: Worker productivity daily rollup cache.
* **`summary_daily_sales`**: Sales channel daily rollup cache.
* **`summary_daily_stock`**: Warehouse stock daily rollup cache.
* **`summary_daily_delivery`**: Courier performance daily rollup cache.
* **`summary_monthly_finance`**: Financial P&L monthly rollup cache.
* **`summary_monthly_payroll`**: Payroll cost monthly rollup cache.
* **`summary_product_margin`**: Product profitability rollup cache.
* **`summary_taxes`**: VAT and tax collection rollup cache.

### Group N: Storefront, Webhooks & Integrations (Waves 23–25)
* **`storefronts`**: Customer-facing online stores (`id`, `tenant_id`, `name`, `domain`, `theme_config_json`).
* **`storefront_pages`**: CMS content pages (`id`, `tenant_id`, `storefront_id`, `slug`, `title`, `content_html`).
* **`storefront_products`**: Public product listings (`id`, `tenant_id`, `storefront_id`, `product_id`, `is_published`).
* **`carts`**: Active shopping carts (`id`, `tenant_id`, `session_token`, `customer_id`, `expires_at`).
* **`cart_items`**: Cart items (`id`, `tenant_id`, `cart_id`, `product_variant_id`, `quantity`).
* **`coupons`**: Discount vouchers (`id`, `tenant_id`, `code`, `discount_type`, `value`, `min_spend`, `expires_at`).
* **`coupon_redemptions`**: Coupon usage tracking (`id`, `tenant_id`, `coupon_id`, `sales_order_id`, `customer_id`).
* **`shipping_zones`**: Delivery fee matrix (`id`, `tenant_id`, `zone_name`, `rate`).
* **`product_reviews`**: Customer reviews (`id`, `tenant_id`, `product_id`, `rating`, `comment`, `is_approved`).
* **`wishlists`**: Saved customer favorites (`id`, `tenant_id`, `customer_id`, `product_id`).
* **`webhook_endpoints`**: Outbound event subscriptions (`id`, `tenant_id`, `url`, `secret`, `events_json`, `is_active`).
* **`webhook_deliveries`**: Outbound delivery attempts (`id`, `tenant_id`, `endpoint_id`, `event`, `response_status`, `attempt_count`).
* **`imports`**: Bulk CSV/XLSX import jobs (`id`, `tenant_id`, `entity_type`, `file_path`, `status`, `row_count`, `error_log_json`).

---

## 3. Database Indexes & Performance Optimization

* **Primary Isolation Index:** All tenant tables carry an index on `tenant_id`.
* **Lookups & Joins:** Composite indexes are placed on `(tenant_id, uuid)`, `(tenant_id, code)`, and `(tenant_id, status)`.
* **High-Frequency Ledger Queries:**
  * `stock_movements`: `INDEX (tenant_id, product_variant_id, warehouse_id, created_at)`
  * `production_batch_inputs`: `INDEX (tenant_id, batch_id)`
  * `worker_production_entries`: `INDEX (tenant_id, batch_id, worker_id, logged_at)`
  * `audit_logs`: `INDEX (tenant_id, auditable_type, auditable_id, created_at)`
