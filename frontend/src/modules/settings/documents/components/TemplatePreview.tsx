// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE PREVIEW — Proportional Live Layout Renderer
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { DocumentType, DocumentTemplateLayoutConfig } from '../../../../types/api/documents';
import { useBusinessConfig } from '../../../../lib/document/useBusinessConfig';
import { SalesInvoiceDocument } from '../../../../components/print/documents/SalesInvoiceDocument';
import { DeliveryChallanDocument } from '../../../../components/print/documents/DeliveryChallanDocument';
import { PurchaseOrderDocument } from '../../../../components/print/documents/PurchaseOrderDocument';
import { GoodsReceiptDocument } from '../../../../components/print/documents/GoodsReceiptDocument';
import { PaymentReceiptDocument } from '../../../../components/print/documents/PaymentReceiptDocument';
import { ThermalReceipt } from '../../../../components/print/receipts/ThermalReceipt';
import { BarcodeLabel } from '../../../../components/print/labels/BarcodeLabel';

export interface TemplatePreviewProps {
  documentType: DocumentType;
  layoutConfig?: DocumentTemplateLayoutConfig;
  paperCode?: string;
  orientation?: 'portrait' | 'landscape';
  scale?: number;
}

export function TemplatePreview({
  documentType,
  layoutConfig,
  paperCode = 'a4_portrait',
  orientation = 'portrait',
  scale = 0.85,
}: TemplatePreviewProps) {
  const { config: businessConfig } = useBusinessConfig();

  // Sample data payload
  const sampleInvoice: any = {
    id: 1,
    uuid: 'sample-inv-uuid',
    invoice_number: 'INV-2026-000042',
    customer_name: 'Apex Industrial Bakeries Ltd.',
    sales_order_number: 'SO-202608-019',
    invoice_date: '2026-08-31',
    due_date: '2026-09-30',
    subtotal: '45200.00',
    tax_amount: '6780.00',
    discount_amount: '1200.00',
    shipping_amount: '500.00',
    round_off: '0.00',
    total_amount: '51280.00',
    paid_amount: '25000.00',
    due_amount: '26280.00',
    status: 'partial',
    items: [
      {
        id: 1,
        product_name: 'Organic Rye Flour (25kg Food Grade Sack)',
        sku: 'ING-RYE-25K',
        batch_number: 'B-202608-41',
        unit: 'Sack',
        quantity: '40',
        unit_price: '850.00',
        discount_amount: '500.00',
        tax_amount: '5025.00',
        line_total: '33500.00',
      },
      {
        id: 2,
        product_name: 'Artisan Sourdough Culture (5L Liquid Master)',
        sku: 'ING-SD-05L',
        batch_number: 'B-202608-42',
        unit: 'Pail',
        quantity: '6',
        unit_price: '1950.00',
        discount_amount: '700.00',
        tax_amount: '1755.00',
        line_total: '11700.00',
      },
    ],
  };

  const sampleChallan: any = {
    id: 1,
    challan_number: 'CHL-2026-000018',
    customer_name: 'Apex Industrial Bakeries Ltd.',
    shipping_address: 'Plot 14, Gazipur Industrial Zone, Dhaka',
    driver_name: 'Rafiqul Islam',
    vehicle_number: 'DHAKA-METRO-TA-14-9821',
    delivery_date: '2026-08-31',
    total_packages: 46,
    items: sampleInvoice.items,
  };

  const samplePO: any = {
    id: 1,
    po_number: 'PO-2026-000088',
    vendor_name: 'National Grain Refineries Ltd.',
    order_date: '2026-08-31',
    expected_delivery_date: '2026-09-07',
    subtotal: '85000.00',
    tax_amount: '12750.00',
    total_amount: '97750.00',
    status: 'approved',
    items: sampleInvoice.items,
  };

  const samplePayment: any = {
    id: 1,
    receipt_number: 'REC-2026-000104',
    customer_name: 'Apex Industrial Bakeries Ltd.',
    payment_date: '2026-08-31',
    amount: '25000.00',
    payment_method: 'Bank Transfer (EFTN)',
    transaction_reference: 'TXN-EFTN-89214710',
    notes: 'Advance installment against INV-2026-000042',
  };

  const sampleProduct: any = {
    id: 1,
    name: 'Artisan Sourdough Loaf (800g)',
    sku: 'FG-BRD-SOUR-01',
    barcode: '8901234567890',
    selling_price: '450.00',
    mfg_date: '2026-08-31',
    exp_date: '2026-09-04',
  };

  const getContainerClass = () => {
    switch (paperCode) {
      case 'a4_landscape':
      case 'a3_landscape':
        return 'document-preview-sheet-a4-landscape';
      case 'thermal_80':
        return 'document-preview-thermal-80';
      case 'thermal_58':
        return 'document-preview-thermal-58';
      case 'label_35x25':
        return 'document-preview-label-35x25';
      case 'label_50x35':
        return 'document-preview-label-50x35';
      case 'a4_portrait':
      default:
        return orientation === 'landscape' ? 'document-preview-sheet-a4-landscape' : 'document-preview-sheet-a4';
    }
  };

  const renderContent = () => {
    switch (documentType) {
      case 'sales_invoice':
        return <SalesInvoiceDocument invoice={sampleInvoice} businessConfig={businessConfig} copyType="ORIGINAL" />;
      case 'delivery_challan':
        return <DeliveryChallanDocument delivery={sampleChallan as any} businessConfig={businessConfig} />;
      case 'purchase_order':
        return <PurchaseOrderDocument po={samplePO} businessConfig={businessConfig} />;
      case 'goods_receipt':
        return <GoodsReceiptDocument grn={{ ...samplePO, grn_number: 'GRN-2026-000031' } as any} businessConfig={businessConfig} />;
      case 'payment_receipt':
        return <PaymentReceiptDocument payment={samplePayment as any} businessConfig={businessConfig} />;
      case 'pos_receipt_80mm':
      case 'pos_receipt_58mm':
        return <ThermalReceipt invoice={sampleInvoice} businessConfig={businessConfig} paperWidth={documentType === 'pos_receipt_58mm' ? '58mm' : '80mm'} />;
      case 'barcode_label':
        return <BarcodeLabel product={sampleProduct as any} preset="standard_50x35" />;
      default:
        return <SalesInvoiceDocument invoice={sampleInvoice} businessConfig={businessConfig} copyType="ORIGINAL" />;
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-950/60 p-4 flex justify-center items-start">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="print-doc shadow-2xl rounded-sm"
      >
        <div className={getContainerClass()}>{renderContent()}</div>
      </div>
    </div>
  );
}
