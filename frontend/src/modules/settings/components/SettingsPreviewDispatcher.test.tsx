import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPreviewDispatcher } from './SettingsPreviewDispatcher';

describe('SettingsPreviewDispatcher & Operational Simulators', () => {
  it('renders StatutoryIdentityCard with certificate view and toggles to masthead', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="identity"
        formValues={{
          company_legal_name: 'Apex Industrial Fabrics Ltd.',
          tax_identification_number: '1234567890123',
          trade_license_no: 'TRAD/DSCC/019283/2026',
          rjsc_registration_no: 'C-99124/2026',
          factory_license_no: 'DIFE-88219-A',
          bin_branch_code: '0001',
        }}
      />
    );

    // Initial certificate view assertions
    expect(screen.getByText('Live Statutory Compliance Simulator')).toBeInTheDocument();
    expect(screen.getAllByText('Apex Industrial Fabrics Ltd.').length).toBeGreaterThan(0);
    expect(screen.getByText(/NBR 13-Digit Compliant/i)).toBeInTheDocument();
    expect(screen.getByText('1234567890123')).toBeInTheDocument();

    // Toggle to VAT 6.3 Masthead
    const mastheadBtn = screen.getByRole('button', { name: /VAT 6.3 Masthead/i });
    fireEvent.click(mastheadBtn);

    expect(screen.getByText(/Official Commercial Invoice Header/i)).toBeInTheDocument();
    expect(screen.getByText(/Mushak 6.3/i)).toBeInTheDocument();
  });

  it('renders FacilitiesHubCard with dual-node topology and contacts', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="facilities_contacts"
        formValues={{
          registered_address: 'Gulshan Tower, Level 14, Dhaka',
          factory_address: 'Sreepur Industrial Estate, Gazipur',
          hotline_phone: '+880 1812-998877',
          support_email: 'ops@apex-industrial.com',
        }}
      />
    );

    expect(screen.getByText('Operational Facilities & Logistics Hub')).toBeInTheDocument();
    expect(screen.getByText('Gulshan Tower, Level 14, Dhaka')).toBeInTheDocument();
    expect(screen.getByText('Sreepur Industrial Estate, Gazipur')).toBeInTheDocument();
    expect(screen.getByText('+880 1812-998877')).toBeInTheDocument();
    expect(screen.getByText('ops@apex-industrial.com')).toBeInTheDocument();
  });

  it('renders CurrencyFiscalSimulator with live computed figures', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="currency"
        formValues={{
          currency_code: 'BDT',
          currency_symbol: '৳',
          decimal_places: 2,
          thousand_separator: ',',
          date_format: 'YYYY-MM-DD',
          time_format: '24h',
          system_timezone: 'Asia/Dhaka',
          fiscal_year_start_month: '7',
          lock_closed_financial_periods: true,
        }}
      />
    );

    expect(screen.getByText('Real-Time Currency & Fiscal Ledger Simulator')).toBeInTheDocument();
    expect(screen.getAllByText(/৳ 1,485,290.75 BDT/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Starts in July/i)).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('renders DocumentSequencerSimulator with pipeline steps and barcode specimen', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="prefixes"
        formValues={{
          invoice_prefix: 'INV-BD-',
          purchase_order_prefix: 'PO-APX-',
          batch_prefix: 'LOT-',
          challan_prefix: 'CHL-',
          quotation_prefix: 'QUO-',
          receipt_prefix: 'MR-',
        }}
      />
    );

    expect(screen.getByText('Sequential Document Pipeline & Barcode Simulator')).toBeInTheDocument();
    expect(screen.getByText('INV-BD-2026-00482')).toBeInTheDocument();
    expect(screen.getByText('PO-APX-2026-00109')).toBeInTheDocument();
    expect(screen.getByText('*INV-BD-2026-00482*')).toBeInTheDocument();
  });

  it('renders PaymentGatewaysSimulator and switches gateways', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="payment_gateways"
        formValues={{
          bkash_merchant_app_key: 'apex_bkash_key_123',
          bkash_sandbox: false,
          nagad_merchant_id: 'NAGAD_M_881',
          sslcommerz_store_id: 'ssl_store_live',
        }}
      />
    );

    expect(screen.getByText('Customer Payment Checkout Experience Simulator')).toBeInTheDocument();
    expect(screen.getByText('Production Live')).toBeInTheDocument();
    expect(screen.getByText('bKash Tokenized Checkout')).toBeInTheDocument();

    // Switch to Nagad
    fireEvent.click(screen.getByRole('button', { name: /Nagad Wallet/i }));
    expect(screen.getByText('Nagad Payment Gateway')).toBeInTheDocument();
    expect(screen.getByText('NAGAD_M_881')).toBeInTheDocument();
  });

  it('renders ThermalReceiptSimulator and allows toggling 80mm vs 58mm', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="pos_receipt"
        formValues={{
          receipt_header_note: 'Fresh Goods Daily',
          receipt_footer_note: 'No cash refunds',
          receipt_printer_template: 'standard_80mm',
          require_manager_pin_for_discount: true,
          require_manager_pin_for_void: true,
        }}
      />
    );

    expect(screen.getByText(/Point of Sale Thermal Receipt Roll/i)).toBeInTheDocument();
    expect(screen.getByText('"Fresh Goods Daily"')).toBeInTheDocument();
    expect(screen.getByText('Thermal Cut Line (80mm)')).toBeInTheDocument();

    // Switch to 58mm
    fireEvent.click(screen.getByRole('button', { name: /58mm Compact/i }));
    expect(screen.getByText('Thermal Cut Line (58mm)')).toBeInTheDocument();
  });

  it('renders SecurityPostureSimulator and calculates rating', () => {
    render(
      <SettingsPreviewDispatcher
        previewType="security"
        formValues={{
          session_timeout_minutes: 15,
          password_min_length: 12,
          password_require_special_char: true,
          max_login_failed_attempts: 3,
          lockout_duration_minutes: 30,
          enforce_2fa_for_admins: true,
          maintenance_mode_active: false,
        }}
      />
    );

    expect(screen.getByText(/Enterprise Security Posture/i)).toBeInTheDocument();
    expect(screen.getByText(/Security Rating: 100\/100/i)).toBeInTheDocument();
  });
});
