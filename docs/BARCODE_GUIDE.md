# Barcode & Symbology Generation Guide
**Document Identifier:** `DOC-BARCODE-2026-001`  
**Engine:** `bwip-js` Vector SVG Generator  

---

## 1. Supported Symbologies

| Format | Symbology Code | Typical Application | Characteristics |
|---|---|---|---|
| **Code 128** | `code128` | Internal ERP Documents, SKUs, Invoices | High-density alphanumeric, auto character set switching, checksum verified |
| **EAN-13** | `ean13` | Retail Products, Master Cases (GTIN-13) | 13-digit numeric with standard Modulo-10 check digit |
| **EAN-8** | `ean8` | Small Retail Packs | 8-digit numeric compact format |
| **UPC-A** | `upca` | North American Retail standard | 12-digit numeric |
| **Code 39** | `code39` | Industrial Raw Materials, Logistics | Alphanumeric (A-Z, 0-9, symbols) |
| **QR Code** | `qrcode` | Document Tax Verification, Digital Signatures | 2D matrix symbology with Error Correction Level M/Q |

---

## 2. Vector SVG Rendering Pipeline

All barcodes in SliceMart FMS are rendered as pure XML/SVG vector elements using `generateBarcodeSvg()` in `src/lib/barcode/engine.ts`:
- **Zero Raster Pixelation:** Crisp edge definition on thermal print heads regardless of scaling.
- **Check-Digit Normalization:** Automatic sanitization with graceful fallback to Code 128 if numeric lengths do not match EAN-13 rules.
- **Scanner Compatibility:** Optimized quiet zones (margins) and bar height for standard 1D laser scanners and 2D area imagers (Honeywell, Datalogic, Zebra).

---

## 3. Label Printing Workflow

### Single & Batch Labels:
1. Navigate to **Catalogue → Products**.
2. Select one or more products.
3. Click **Print Barcodes** to open the **Barcode & Label Generator Modal**.
4. Select symbology (Code 128 / EAN-13 / QR Code), paper size (50×35mm Roll or A4 Sheet 24-up), and fields to display (Price, SKU, Name, Expiry).
5. Click **Print Document** or **Save PDF**.
