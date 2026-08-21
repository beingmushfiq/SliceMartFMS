# TASK PROTOCOL

> **Status:** Canonical (rank 6). How a single unit of work is executed, from
> the request to the merge.
>
> **Last updated:** 2026-08-22 · **Phase:** 0 complete

---

## 0. What this document is for

Every large system dies the same way: not from one bad decision, but from a
hundred small tasks each done slightly differently. One developer scopes by
`tenant_id` in the query, another in the controller. One returns `404` for a
foreign record, another `403`. One writes the loading state, another ships a
spinner and a `TODO`. Six weeks later nobody can say what the system does.

This document exists so that **the order of work is not a matter of personal
preference.** It is deliberately rigid. Rigidity here is what buys freedom
everywhere else — you never have to re-decide how to start, so all your
attention goes to the actual problem.

It applies to every task: a new module, a single endpoint, a bug fix, a UI
change, a schema change, a refactor.

---

## 1. The five phases of a task

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  1. ORIENT      Read the canon. Establish what is already true.  │
  │                 Output: the ADRs and doc sections that bind you. │
  ├──────────────────────────────────────────────────────────────────┤
  │  2. SCOPE       State what you will build and what you will not. │
  │                 Output: a written scope + conflicts surfaced.    │
  ├──────────────────────────────────────────────────────────────────┤
  │  3. CONTRACT    Document before you code.                        │
  │                 Output: schema + endpoint + states, in the docs. │
  ├──────────────────────────────────────────────────────────────────┤
  │  4. BUILD       The fixed order. Back to front. No skipping.     │
  │                 Output: working, tested vertical slice.          │
  ├──────────────────────────────────────────────────────────────────┤
  │  5. CLOSE       Verify against the Definition of Done. Update    │
  │                 the docs in the same change.                     │
  └──────────────────────────────────────────────────────────────────┘
```

You may loop back. Discovering in phase 4 that the contract was wrong is normal
and healthy — go back to phase 3, fix the document, then continue. What is
**not** allowed is skipping forward: no code in phase 2, no undocumented
endpoint in phase 4.

---

## 2. Phase 1 — Orient

**Never start from the request alone.** The request tells you what someone
wants; the canon tells you what is already true.

### 2.1 Always read

| Read | For |
|---|---|
| `DEVELOPMENT_STATUS.md` | Which phase is open, what is in flight, known gaps |
| `ROADMAP.md` §3 for the current phase | Whether this task belongs to this phase at all |
| `MODULE_MAP.md` §2 for the module | Its dependencies, its phase, its permission namespace |
| `DECISIONS.md` | Search for the topic. If an ADR covers it, it is settled. |

### 2.2 Then read, by task type

| Task type | Additional required reading |
|---|---|
| New table / column | `DATABASE_DESIGN.md` conventions + the table group + the migration wave |
| New endpoint | `API_CONTRACT.md` §envelope, §errors, §pagination, §idempotency + the endpoint family |
| New screen | `UI_SYSTEM.md` §6.4 archetypes → §8 state matrix → §10 inventory → §11/§12 if table or form |
| Money, stock or production write | `ARCHITECTURE.md` transaction boundaries + `DATABASE_DESIGN.md` ledger + ADR-013, ADR-009 |
| Permission | `MODULE_MAP.md` §7 registry + `ARCHITECTURE.md` RBAC |
| Motion or loading | `UI_SYSTEM.md` §7 + ADR-031 |
| Report | `RMS_REPORT_MATRIX.md` + `API_CONTRACT.md` §reports |
| Bug fix | The document that specifies the correct behaviour — **the bug is a deviation from a spec, or the spec is missing** |

### 2.3 The orientation output

Before writing anything, you should be able to state, in two or three lines:

- Which module this belongs to, and which phase.
- Which ADRs constrain it.
- Whether the thing you are about to build **already exists** under another
  name. (Search the codebase. Duplicated concepts are the most expensive
  category of mistake in this system.)

If any of those three is unclear, you are still in phase 1.

---

## 3. Phase 2 — Scope

### 3.1 Write the scope down

Three short lists, before any file is touched:

1. **In scope** — the specific behaviour being delivered.
2. **Out of scope** — the adjacent things you are deliberately not doing.
3. **Touches** — the files, tables, endpoints and screens that will change.

The out-of-scope list is the one that matters. It is how a two-hour task stays a
two-hour task.

### 3.2 Surface conflicts now, not later

**Stop and ask** if any of these is true:

| Condition | Why you must stop |
|---|---|
| The request contradicts an accepted ADR | Only an explicit override can change a decision (`DECISIONS.md` §0) |
| The request needs an endpoint the contract does not describe | ADR-029: that is a documentation task first, not an invented call |
| The request needs a table or column not in `DATABASE_DESIGN.md` | Same. Schema is designed, not accreted. |
| The task belongs to a later phase | `ROADMAP.md` §1: phases are gated, not overlapping |
| The answer depends on an open question (`DECISIONS.md` §7) | Do not invent a business rule. Guessing a tax model or an incentive formula produces confidently wrong money. |
| Two rank-4 documents disagree | That is a rank-1 problem. It needs an ADR, not a judgement call. |

State the conflict plainly, propose the options, and wait. A blocked task that
asked is always cheaper than an unblocked task that guessed.

### 3.3 Size it honestly

If the "touches" list spans more than one module, it is more than one task.
Split it. Vertical slices are the unit of work (`ROADMAP.md` §1) — one module,
migration through UI, complete — not "all the migrations", then "all the
controllers".

---

## 4. Phase 3 — Contract before code

This phase is short and it is not optional.

| Change | Document it here, first |
|---|---|
| A table or column | `DATABASE_DESIGN.md` — including indexes, the tenant-scoped unique key, and the migration wave |
| An endpoint | `API_CONTRACT.md` — path, method, permission, request, response, error codes, idempotency, pagination |
| An error code | `API_CONTRACT.md` §3 **and** the `StateView` registry row in `UI_SYSTEM.md` §8.2. A code without a designed state is not a code. |
| A permission | `MODULE_MAP.md` §7 |
| A status value | `UI_SYSTEM.md` §10.4 badge registry, so the same status looks identical everywhere |
| A new page archetype | A note in `DECISIONS.md` (`UI_SYSTEM.md` §6.4 requires it) |
| Anything that resolves an open question | Promote it to an ADR, then remove the question |

Why this order rather than "code first, document after": documenting after means
the document records what you happened to build. Documenting first means the
build is checked against a decision. Those produce different systems.

---

## 5. Phase 4 — Build, in the fixed order

**ADR-029. Back to front. Every time.**

```
  migration
     └─ model (BelongsToTenant, casts, relations, guarded tenant_id)
         └─ enum / state machine (explicit allowed transitions)
             └─ action / service (all business rules, transaction boundary)
                 └─ policy + form request (authorisation, validation)
                     └─ contract entry (already written in phase 3 — verify)
                         └─ controller + API resource
                             └─ routes (correct scope file, correct middleware)
                                 └─ events + audit listener
                                     └─ factories + seeders (demo tenant only)
                                         └─ feature tests
                                             └─ generated TS types
                                                 └─ query hooks + Zod schemas
                                                     └─ UI (full state matrix)
```

### 5.1 Rules that apply at every step

| Rule | Detail |
|---|---|
| **Never build the frontend against an imaginary API** | The endpoint exists and is tested before the screen consumes it. MSW handlers derive from the real contract, never from a mock data module. |
| **Never generate types by hand** | `frontend/src/types/api/**` is generated. A hand-written duplicate will drift, and drift is silent. |
| **Every tenant-owned table gets the trait and the test** | The isolation test is written in the same commit as the endpoint, not "in the testing phase". |
| **Money and quantity are strings end to end** | `DECIMAL(18,4)` in MySQL, string in JSON, string in the form field, string in the total. No `float`, no `parseFloat`, no `type="number"` for money. |
| **Stock moves only through the ledger** | Never `UPDATE stock_balances SET quantity = ...`. Write the movement; the balance follows. |
| **One transaction boundary per business operation** | The eleven boundaries in `ARCHITECTURE.md` are the complete list. Adding a twelfth is a documented decision. |
| **No placeholder, no mock, no TODO in merged code** | If it is not finished, it is not merged. A placeholder is a lie with a timestamp. |
| **Both themes, both locales, from the first commit** | Retrofitting `bn` or dark mode across 40 screens is a project. Doing it per screen is a habit. |

### 5.2 Testing is part of the build, not after it

Minimum per endpoint (`MODULE_MAP.md` §6 item 10):

1. Happy path.
2. Validation failure — asserting the `fields` shape the UI relies on.
3. `401` unauthenticated.
4. `403` without the permission.
5. **Cross-tenant isolation — a second tenant's ID must return `404`.**
6. At least one real unhappy path (insufficient stock, closed period, invalid
   transition, version conflict — whichever the domain actually has).

A feature whose only test is the happy path is untested, because the happy path
is the one case you already checked by hand.

### 5.3 UI is not done when it renders

Per `UI_SYSTEM.md` §8, a screen ships with every applicable state built and
verifiable: loading, skeleton, empty-no-data **and** empty-filtered-to-zero,
validation, business-rule violation as a panel, warning, network failure, `401`,
`403`, `OUT_OF_SCOPE` with a branch switcher, session expiry as a modal that
does not discard work, `404`, `500`, timeout with the "your data may have been
saved" wording, duplicate/idempotent replay, version conflict, unsaved changes,
offline, partial failure, stale data.

Then: keyboard operable, axe-clean, both themes, both locales, motion disabled
and still fully usable.

---

## 6. Phase 5 — Close

### 6.1 The Definition of Done

`MODULE_MAP.md` §6 lists thirteen artefacts. **Twelve of thirteen is not done.**
Walk the list explicitly rather than from memory.

### 6.2 Documentation is part of the change

Update in the same commit:

| Document | When |
|---|---|
| `API_CONTRACT.md` | Any endpoint, error code, or envelope detail changed |
| `DATABASE_DESIGN.md` | Any table, column, index or wave changed |
| `UI_SYSTEM.md` | A new component, token, status badge or state treatment |
| `MODULE_MAP.md` | A new permission or a changed dependency |
| `DECISIONS.md` | A decision was made, superseded, or an open question resolved |
| `DEVELOPMENT_STATUS.md` | **Always.** What shipped, what is now true, what is next. |

### 6.3 The self-review pass

Before asking anyone else to look, check the things reviewers most often catch:

- Is there any hardcoded tenant, currency, locale, timezone, warehouse or line?
- Does a foreign-tenant ID return `404`?
- Does the mutating endpoint accept and honour `Idempotency-Key`?
- Is every list endpoint paginated server-side, with the URL as the source of
  truth on the client?
- Are money values strings on the wire and right-aligned `tabular-nums` on
  screen, with the unit stated once in the column header?
- Does every error path offer a next action?
- Did you construct any class name dynamically? (`UI_SYSTEM.md` §9.2 — Tailwind
  never compiles it and the style silently does nothing.)
- Does the change work with JavaScript animations disabled?
- Did you leave a `console.log`, a commented-out block, or a file you created to
  test something?

### 6.4 Commit and PR

- One task, one logical change. Schema, backend, tests, types and UI for a
  single slice belong together — they are one thing.
- The commit message says **why**, not what. The diff already says what.
- The PR body names the module, the phase, the ADRs it honours, and the exit
  gate items it advances.

---

## 7. Working with the phase gates

`ROADMAP.md` §4 gives each phase a numbered exit gate. Two consequences for
daily work:

1. **Do not start Phase N+1 work during Phase N.** Not "just the migration".
   Not "just scaffolding". The gate exists so that the foundation is proven
   before anything is stacked on it.
2. **A phase can be re-opened.** If Phase 4 reveals that the Phase 3 ledger
   design was wrong, reopening Phase 3 is correct behaviour, not failure.
   Building a workaround on top of a known-wrong foundation is failure.

---

## 8. When you are stuck

| Situation | Do this |
|---|---|
| Two documents disagree | Apply the precedence table (`README.md` §2). If the tie is within rank 4, escalate — it needs an ADR. |
| The spec does not cover your case | Say so and propose two options with trade-offs. Do not pick silently. |
| The correct answer is a business rule nobody has stated | Check `DECISIONS.md` §7 open questions. If it is there, it is blocked by design. Ask. |
| The clean solution is large and the quick one is small | State both, with the cost of the quick one. The decision is not yours alone, but the honesty is. |
| Something in the canon looks wrong | It might be. Propose an ADR that supersedes it. That is the mechanism, and using it is encouraged. |

The one thing never to do is proceed on an assumption you would not be willing
to write down.

---

## 9. Anti-patterns that block a merge

| # | Anti-pattern |
|---|---|
| 1 | Building the UI first and the endpoint after |
| 2 | Hand-writing a type that should be generated |
| 3 | A placeholder page, a mock data module, or a `TODO` in merged code |
| 4 | An endpoint that is not in `API_CONTRACT.md` |
| 5 | A table that is not in `DATABASE_DESIGN.md` |
| 6 | A tenant-owned query without tenant scoping |
| 7 | `403` where the answer should be `404` |
| 8 | A mutating endpoint without idempotency |
| 9 | Money in a `float`, or through `parseFloat` |
| 10 | Writing `stock_balances` directly |
| 11 | A screen missing an applicable state |
| 12 | A `dark:` variant, a raw hex value, or a dynamically built class name |
| 13 | Server data copied into a Zustand store |
| 14 | A hardcoded tenant name, currency, locale or date |
| 15 | Shipping code without updating the document it contradicts |

---

## 10. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Supersedes `_legacy/AI_TASK_PROTOCOL.md` and `_legacy/Task_Protocol.md`, both non-authoritative. Aligned to ADR-029 build order and `MODULE_MAP.md` §6 Definition of Done. |
