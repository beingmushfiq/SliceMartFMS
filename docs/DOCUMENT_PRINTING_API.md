# Document Templates & Printing API Specification
**Document Identifier:** `DOC-API-2026-001`  
**Base Route Prefix:** `/api/v1/documents`  
**Authentication:** Bearer JWT (`auth.jwt`, `tenant.resolve`, `tenant.active`)  

---

## 1. Overview

The Documents & Printing API provides tenant-isolated CRUD, version snapshotting, paper dimension registry, printer device profiles, server-side atomic number sequence generation, and append-only reprint audit logs.

---

## 2. Endpoints Matrix

| Method | Endpoint | Description | Required Permission |
|---|---|---|---|
| `GET` | `/api/v1/documents/templates` | List all document templates | `documents.template.view` |
| `POST` | `/api/v1/documents/templates` | Create a new document template | `documents.template.create` |
| `GET` | `/api/v1/documents/templates/resolve` | Hierarchy template resolution | Tenant Authenticated |
| `GET` | `/api/v1/documents/templates/{id}` | Get template by ID with active version | `documents.template.view` |
| `PUT` | `/api/v1/documents/templates/{id}` | Update template & bump version | `documents.template.update` |
| `DELETE` | `/api/v1/documents/templates/{id}` | Archive document template | `documents.template.delete` |
| `POST` | `/api/v1/documents/templates/{id}/set-default` | Set template as tenant default | `documents.template.manage` |
| `POST` | `/api/v1/documents/templates/{id}/duplicate` | Clone template to a new copy | `documents.template.create` |
| `GET` | `/api/v1/documents/templates/{id}/versions` | List historical versions | `documents.template.view` |
| `POST` | `/api/v1/documents/templates/{id}/versions/{version}/activate` | Restore/activate historical version | `documents.template.manage` |
| `GET` | `/api/v1/documents/paper-sizes` | List system & custom paper sizes | Tenant Authenticated |
| `POST` | `/api/v1/documents/paper-sizes` | Create custom paper size | `documents.paper_size.manage` |
| `PUT` | `/api/v1/documents/paper-sizes/{id}` | Update custom paper size | `documents.paper_size.manage` |
| `DELETE` | `/api/v1/documents/paper-sizes/{id}` | Delete custom paper size | `documents.paper_size.manage` |
| `GET` | `/api/v1/documents/print-profiles` | List print device profiles | Tenant Authenticated |
| `POST` | `/api/v1/documents/print-profiles` | Create print profile | `documents.print_profile.manage` |
| `PUT` | `/api/v1/documents/print-profiles/{id}` | Update print profile | `documents.print_profile.manage` |
| `DELETE` | `/api/v1/documents/print-profiles/{id}` | Delete print profile | `documents.print_profile.manage` |
| `GET` | `/api/v1/documents/numbering` | List document number sequences | Tenant Authenticated |
| `POST` | `/api/v1/documents/numbering` | Create document sequence | `documents.numbering.manage` |
| `PUT` | `/api/v1/documents/numbering/{id}` | Update prefix, padding, reset | `documents.numbering.manage` |
| `GET` | `/api/v1/documents/print-history` | Query paginated reprint history | `documents.history.view` |
| `POST` | `/api/v1/documents/print-history` | Record print / PDF / reprint event | `documents.document.print` |

---

## 3. Request / Response Examples

### 3.1 Template Resolution
```http
GET /api/v1/documents/templates/resolve?document_type=sales_invoice&branch_id=2 HTTP/1.1
Authorization: Bearer <jwt-token>
```

**Response (`200 OK`):**
```json
{
  "data": {
    "id": 1,
    "uuid": "7a35e40e-7447-494b-9721-a4be8f7514a1",
    "name": "Standard Commercial VAT Invoice",
    "document_type": "sales_invoice",
    "is_default": true,
    "current_version": 1,
    "paper_size": {
      "code": "a4_portrait",
      "name": "ISO A4 Portrait (210 × 297 mm)",
      "width_mm": 210.0,
      "height_mm": 297.0
    },
    "active_version": {
      "version": 1,
      "layout_config": {
        "showLogo": true,
        "showCompanyTax": true,
        "showCustomerTax": true,
        "showBatchNumber": true,
        "showAmountInWords": true,
        "showSignatures": true,
        "primaryColor": "#0f172a"
      }
    }
  }
}
```

### 3.2 Audit Log Print Event
```http
POST /api/v1/documents/print-history HTTP/1.1
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "document_type": "sales_invoice",
  "document_id": 42,
  "document_number": "INV-2026-000042",
  "template_id": 1,
  "template_version": 1,
  "action": "print",
  "copies": 1
}
```
