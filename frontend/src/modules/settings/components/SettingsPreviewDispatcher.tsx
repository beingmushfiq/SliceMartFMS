import React from 'react';
import { StatutoryIdentityCard } from './previews/StatutoryIdentityCard';
import { FacilitiesHubCard } from './previews/FacilitiesHubCard';
import { BrandAssetsStudio } from './previews/BrandAssetsStudio';
import { CurrencyFiscalSimulator } from './previews/CurrencyFiscalSimulator';
import { DocumentSequencerSimulator } from './previews/DocumentSequencerSimulator';
import { PaymentGatewaysSimulator } from './previews/PaymentGatewaysSimulator';
import { MessagingDeliverySimulator } from './previews/MessagingDeliverySimulator';
import { LogisticsDispatchSimulator } from './previews/LogisticsDispatchSimulator';
import { StorefrontCheckoutSimulator } from './previews/StorefrontCheckoutSimulator';
import { ProductionRoutingSimulator } from './previews/ProductionRoutingSimulator';
import { InventoryValuationSimulator } from './previews/InventoryValuationSimulator';
import { ProcurementWorkflowSimulator } from './previews/ProcurementWorkflowSimulator';
import { CommercialTermsSimulator } from './previews/CommercialTermsSimulator';
import { ThermalReceiptSimulator } from './previews/ThermalReceiptSimulator';
import { QualityInspectionSimulator } from './previews/QualityInspectionSimulator';
import { PayrollShiftSimulator } from './previews/PayrollShiftSimulator';
import { VatLedgerSimulator } from './previews/VatLedgerSimulator';
import { SecurityPostureSimulator } from './previews/SecurityPostureSimulator';
import { DocumentReportSimulator } from './previews/DocumentReportSimulator';

export type PreviewType =
  | 'identity'
  | 'facilities_contacts'
  | 'branding'
  | 'currency'
  | 'prefixes'
  | 'payment_gateways'
  | 'messaging'
  | 'courier_apis'
  | 'delivery'
  | 'storefront'
  | 'production'
  | 'inventory'
  | 'procurement'
  | 'commercial'
  | 'pos_receipt'
  | 'qc_standards'
  | 'payroll'
  | 'finance'
  | 'security'
  | 'reports';

interface SettingsPreviewDispatcherProps {
  previewType?: string;
  formValues: Record<string, unknown>;
}

export const SettingsPreviewDispatcher: React.FC<SettingsPreviewDispatcherProps> = ({
  previewType,
  formValues,
}) => {
  if (!previewType) return null;

  switch (previewType) {
    case 'identity':
      return (
        <StatutoryIdentityCard
          companyLegalName={formValues['company_legal_name'] as string}
          tradeLicenseNo={formValues['trade_license_no'] as string}
          taxIdentificationNumber={formValues['tax_identification_number'] as string}
          rjscRegistrationNo={formValues['rjsc_registration_no'] as string}
          factoryLicenseNo={formValues['factory_license_no'] as string}
          binBranchCode={formValues['bin_branch_code'] as string}
        />
      );

    case 'facilities_contacts':
      return (
        <FacilitiesHubCard
          registeredAddress={formValues['registered_address'] as string}
          factoryAddress={formValues['factory_address'] as string}
          hotlinePhone={formValues['hotline_phone'] as string}
          supportEmail={formValues['support_email'] as string}
        />
      );

    case 'branding':
      return (
        <BrandAssetsStudio
          logoUrl={formValues['brand_logo_url'] as string}
          faviconUrl={formValues['brand_favicon_url'] as string}
          companyName={formValues['company_legal_name'] as string}
        />
      );

    case 'currency':
      return (
        <CurrencyFiscalSimulator
          currencyCode={formValues['currency_code'] as string}
          currencySymbol={formValues['currency_symbol'] as string}
          decimalPlaces={formValues['decimal_places'] as number}
          thousandSeparator={formValues['thousand_separator'] as string}
          dateFormat={formValues['date_format'] as string}
          timeFormat={formValues['time_format'] as string}
          systemTimezone={formValues['system_timezone'] as string}
          fiscalYearStartMonth={formValues['fiscal_year_start_month'] as string}
          lockClosedFinancialPeriods={formValues['lock_closed_financial_periods'] as boolean}
        />
      );

    case 'prefixes':
      return (
        <DocumentSequencerSimulator
          invoicePrefix={formValues['invoice_prefix'] as string}
          purchaseOrderPrefix={formValues['purchase_order_prefix'] as string}
          batchPrefix={formValues['batch_prefix'] as string}
          challanPrefix={formValues['challan_prefix'] as string}
          quotationPrefix={formValues['quotation_prefix'] as string}
          receiptPrefix={formValues['receipt_prefix'] as string}
        />
      );

    case 'payment_gateways':
      return (
        <PaymentGatewaysSimulator
          bkashAppKey={formValues['bkash_merchant_app_key'] as string}
          bkashSandbox={formValues['bkash_sandbox'] as boolean}
          nagadMerchantId={formValues['nagad_merchant_id'] as string}
          sslStoreId={formValues['sslcommerz_store_id'] as string}
        />
      );

    case 'messaging':
      return (
        <MessagingDeliverySimulator
          smsProvider={formValues['sms_provider'] as string}
          smsSenderId={formValues['sms_sender_id'] as string}
          whatsappPhoneNumberId={formValues['whatsapp_phone_number_id'] as string}
        />
      );

    case 'delivery':
    case 'courier_apis':
      return (
        <LogisticsDispatchSimulator
          defaultCourierProvider={formValues['default_courier_provider'] as string}
          autoBookCourier={formValues['auto_book_courier_on_order_approval'] as boolean}
          codChargePercentage={formValues['cod_charge_percentage'] as number}
        />
      );

    case 'storefront':
      return (
        <StorefrontCheckoutSimulator
          minOrderAmount={formValues['min_order_amount'] as number}
          freeShippingThreshold={formValues['free_shipping_threshold'] as number}
          estimatedDeliveryDaysInsideCity={formValues['estimated_delivery_days_inside_city'] as number}
          estimatedDeliveryDaysOutsideCity={formValues['estimated_delivery_days_outside_city'] as number}
          whatsappOrderingEnabled={formValues['whatsapp_ordering_enabled'] as boolean}
          whatsappBusinessNumber={formValues['whatsapp_business_number'] as string}
          guestCheckoutAllowed={formValues['guest_checkout_allowed'] as boolean}
        />
      );

    case 'production':
      return (
        <ProductionRoutingSimulator
          schedulingMode={formValues['scheduling_mode'] as string}
          materialAllocationPolicy={formValues['material_allocation_policy'] as string}
          autoIssueMaterials={formValues['auto_issue_materials_on_batch_release'] as boolean}
          scrapTolerancePercent={formValues['scrap_wastage_tolerance_percent'] as number}
          minBatchYieldPercent={formValues['min_batch_yield_threshold_percent'] as number}
          enforceMaintenanceLock={formValues['enforce_machine_maintenance_lock'] as boolean}
        />
      );

    case 'inventory':
      return (
        <InventoryValuationSimulator
          valuationMethod={formValues['valuation_method'] as string}
          lowStockThreshold={formValues['low_stock_threshold_default'] as number}
          allowNegativeStock={formValues['allow_negative_stock'] as boolean}
          autoQuarantineFailedStock={formValues['auto_quarantine_failed_qc_stock'] as boolean}
        />
      );

    case 'procurement':
      return (
        <ProcurementWorkflowSimulator
          poApprovalThreshold={formValues['po_approval_threshold_amount'] as number}
          autoGeneratePo={formValues['auto_generate_po_on_reorder_level'] as boolean}
          enforceThreeWayMatching={formValues['enforce_three_way_matching'] as boolean}
          supplierLeadTimeBufferDays={formValues['supplier_lead_time_buffer_days'] as number}
        />
      );

    case 'commercial':
      return (
        <CommercialTermsSimulator
          defaultPaymentTerms={formValues['default_payment_terms'] as string}
          creditLimitAction={formValues['credit_limit_action'] as string}
          maxCommercialDiscountPercent={formValues['max_commercial_discount_percent'] as number}
          invoiceOverdueGraceDays={formValues['invoice_overdue_grace_days'] as number}
          autoGenerateDelivery={formValues['auto_generate_delivery_on_invoice'] as boolean}
        />
      );

    case 'pos_receipt':
      return (
        <ThermalReceiptSimulator
          receiptHeaderNote={formValues['receipt_header_note'] as string}
          receiptFooterNote={formValues['receipt_footer_note'] as string}
          receiptPrinterTemplate={formValues['receipt_printer_template'] as string}
          requirePinForDiscount={formValues['require_manager_pin_for_discount'] as boolean}
          requirePinForVoid={formValues['require_manager_pin_for_void'] as boolean}
        />
      );

    case 'qc_standards':
      return (
        <QualityInspectionSimulator
          samplingAqlStandard={formValues['sampling_aql_standard'] as string}
          samplingPercentage={formValues['sampling_percentage'] as number}
          autoRejectOnCriticalDefect={formValues['auto_reject_on_critical_defect'] as boolean}
          quarantineHoldDays={formValues['quarantine_hold_period_days'] as number}
        />
      );

    case 'payroll':
      return (
        <PayrollShiftSimulator
          standardWorkingDays={formValues['standard_working_days_per_week'] as number}
          dailyStandardWorkHours={formValues['daily_standard_work_hours'] as number}
          overtimeRateMultiplier={formValues['overtime_rate_multiplier'] as number}
          shiftAttendanceGraceMins={formValues['shift_attendance_grace_period_mins'] as number}
          monthlyDisbursementDay={formValues['monthly_salary_disbursement_day'] as number}
          providentFundPercent={formValues['provident_fund_employee_deduction_percent'] as number}
        />
      );

    case 'finance':
      return (
        <VatLedgerSimulator
          defaultVatRatePercent={formValues['default_vat_rate_percent'] as number}
          autoPostGlVouchers={formValues['auto_post_gl_vouchers'] as boolean}
          allowUnbalancedJournals={formValues['allow_unbalanced_manual_journals'] as boolean}
          lockHistoricalDepreciation={formValues['lock_historical_depreciation'] as boolean}
          roundingAccountCode={formValues['rounding_expense_account_code'] as string}
        />
      );

    case 'security':
      return (
        <SecurityPostureSimulator
          sessionTimeoutMinutes={formValues['session_timeout_minutes'] as number}
          passwordMinLength={formValues['password_min_length'] as number}
          passwordRequireSpecialChar={formValues['password_require_special_char'] as boolean}
          maxLoginFailedAttempts={formValues['max_login_failed_attempts'] as number}
          lockoutDurationMinutes={formValues['lockout_duration_minutes'] as number}
          enforce2faForAdmins={formValues['enforce_2fa_for_admins'] as boolean}
          maintenanceModeActive={formValues['maintenance_mode_active'] as boolean}
        />
      );

    case 'reports':
      return (
        <DocumentReportSimulator
          defaultExportFormat={formValues['default_export_format'] as string}
          defaultPaperSize={formValues['default_paper_size'] as string}
          defaultReportOrientation={formValues['default_report_orientation'] as string}
          printCompanyHeader={formValues['print_company_header_on_export'] as boolean}
          includeTimestampFooter={formValues['include_generated_timestamp_footer'] as boolean}
        />
      );

    default:
      return null;
  }
};
