# SLICE MART — ARCHITECTURE

## Recommended Architecture
Modular monolith.

Backend: Laravel domains with thin controllers, Form Requests, Policies, Services/Actions, API Resources and tests.
Frontend: feature-oriented React application with shared UI/design system and typed API services.

## Backend Domains
Auth; Users/Roles/Permissions; Products; Materials/BOM; Inventory; Production; QC/Rework; Purchasing; CRM/Leads; Sales/Invoices; Collections; HR; Assets; Finance; Notifications; Reports; Audit.

## Frontend Domains
auth; dashboard; products; materials; inventory; production; qc; purchase; crm; sales; hr; assets; finance; reports.

## API
Prefix: /api/v1. Use consistent response, pagination, validation and authorization contracts.

## Transaction Boundaries
Lead conversion; invoice posting; payment allocation; purchase receipt; warehouse transfer; production completion/material issue; QC/rework transitions; incentive finalization.

## Inventory
Stock ledger is the audit source. Current balance may be optimized, but every change must map to a movement and source transaction.

## Reporting
Reports consume authoritative data. Do not create separate conflicting business calculations for reports.
