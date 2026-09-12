import { describe, it, expect } from 'vitest';
import { autoMapColumns } from '../columnMapper';
import { validateImportRows } from '../rowValidator';
import type { ImportColumnDef } from '../types';

describe('Universal Import Engine', () => {
  const testColumns: ImportColumnDef[] = [
    {
      key: 'employee_code',
      label: 'Employee Code',
      required: false,
      type: 'string',
      sampleValue: 'EMP-001',
      aliases: ['code', 'emp_id', 'staff_id'],
    },
    {
      key: 'first_name',
      label: 'First Name',
      required: true,
      type: 'string',
      sampleValue: 'John',
      aliases: ['fname', 'given name'],
    },
    {
      key: 'email',
      label: 'Email Address',
      required: false,
      type: 'email',
      sampleValue: 'john@example.com',
      aliases: ['email', 'mail'],
    },
    {
      key: 'employment_type',
      label: 'Employment Type',
      required: false,
      type: 'enum',
      options: ['permanent', 'contract', 'daily_wage'],
      sampleValue: 'permanent',
    },
    {
      key: 'date_of_joining',
      label: 'Date of Joining',
      required: false,
      type: 'date',
      sampleValue: '2025-01-15',
    },
  ];

  describe('autoMapColumns', () => {
    it('should map exact matches and case-insensitive headers', () => {
      const uploadedHeaders = ['first_name', 'EMAIL ADDRESS', 'Employment Type'];
      const mapping = autoMapColumns(uploadedHeaders, testColumns);

      expect(mapping['first_name']).toBe('first_name');
      expect(mapping['email']).toBe('EMAIL ADDRESS');
      expect(mapping['employment_type']).toBe('Employment Type');
    });

    it('should map headers using configured aliases', () => {
      const uploadedHeaders = ['staff_id', 'fname', 'mail'];
      const mapping = autoMapColumns(uploadedHeaders, testColumns);

      expect(mapping['employee_code']).toBe('staff_id');
      expect(mapping['first_name']).toBe('fname');
      expect(mapping['email']).toBe('mail');
    });

    it('leaves unmapped columns empty when no match exists', () => {
      const uploadedHeaders = ['RandomHeader1', 'RandomHeader2'];
      const mapping = autoMapColumns(uploadedHeaders, testColumns);

      expect(mapping['first_name']).toBe('');
      expect(mapping['employee_code']).toBe('');
    });
  });

  describe('validateImportRows', () => {
    const mapping: Record<string, string> = {
      employee_code: 'Emp Code',
      first_name: 'First Name',
      email: 'Email',
      employment_type: 'Type',
      date_of_joining: 'Join Date',
    };

    it('correctly marks valid rows', () => {
      const rawRows = [
        {
          'Emp Code': 'EMP-101',
          'First Name': 'Alice',
          'Email': 'alice@domain.com',
          'Type': 'permanent',
          'Join Date': '2025-03-01',
        },
      ];

      const result = validateImportRows(
        rawRows,
        mapping,
        testColumns,
        'employee_code'
      );

      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(0);
      expect(result.parsedRows[0]!.isValid).toBe(true);
      expect(result.parsedRows[0]!.parsed.first_name).toBe('Alice');
      expect(result.parsedRows[0]!.parsed.email).toBe('alice@domain.com');
    });

    it('flags missing required fields', () => {
      const rawRows = [
        {
          'Emp Code': 'EMP-102',
          'First Name': '', // Required field missing!
          'Email': 'bob@domain.com',
        },
      ];

      const result = validateImportRows(
        rawRows,
        mapping,
        testColumns,
        'employee_code'
      );

      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(1);
      expect(result.parsedRows[0]!.isValid).toBe(false);
      expect(result.parsedRows[0]!.errors['first_name']).toBe(
        'First Name is required.'
      );
    });

    it('flags invalid email addresses', () => {
      const rawRows = [
        {
          'Emp Code': 'EMP-103',
          'First Name': 'Charlie',
          'Email': 'not-an-email',
        },
      ];

      const result = validateImportRows(
        rawRows,
        mapping,
        testColumns,
        'employee_code'
      );

      expect(result.invalidCount).toBe(1);
      expect(result.parsedRows[0]!.errors['email']).toBe(
        'Invalid email address format.'
      );
    });

    it('flags invalid enum options', () => {
      const rawRows = [
        {
          'Emp Code': 'EMP-104',
          'First Name': 'Diana',
          'Type': 'invalid_type',
        },
      ];

      const result = validateImportRows(
        rawRows,
        mapping,
        testColumns,
        'employee_code'
      );

      expect(result.invalidCount).toBe(1);
      expect(result.parsedRows[0]!.errors['employment_type']).toContain(
        'Value must be one of: permanent, contract, daily_wage'
      );
    });

    it('detects duplicate unique keys within the uploaded file', () => {
      const rawRows = [
        {
          'Emp Code': 'EMP-999',
          'First Name': 'Emp One',
        },
        {
          'Emp Code': 'EMP-999', // Duplicate!
          'First Name': 'Emp Two',
        },
      ];

      const result = validateImportRows(
        rawRows,
        mapping,
        testColumns,
        'employee_code'
      );

      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(1);
      expect(result.parsedRows[1]!.errors['employee_code']).toBe(
        'Duplicate employee_code found in uploaded file.'
      );
    });
  });

  describe('Product & Party Schema Integration', () => {
    it('accurately automaps product CSV aliases', async () => {
      const { productImportSchema } = await import('../../../modules/catalogue/schemas/productImportSchema');
      const uploadedProductHeaders = ['Item Code', 'Item Name', 'Sale Price', 'UOM', 'Cost'];
      const mapping = autoMapColumns(uploadedProductHeaders, productImportSchema.columns);

      expect(mapping['sku']).toBe('Item Code');
      expect(mapping['name']).toBe('Item Name');
      expect(mapping['selling_price']).toBe('Sale Price');
      expect(mapping['unit']).toBe('UOM');
      expect(mapping['cost_price']).toBe('Cost');
    });

    it('accurately automaps party CSV aliases', async () => {
      const { partyImportSchema } = await import('../../../modules/catalogue/schemas/partyImportSchema');
      const uploadedPartyHeaders = ['Company Name', 'Customer Code', 'Contact Number', 'BIN', 'Party Role'];
      const mapping = autoMapColumns(uploadedPartyHeaders, partyImportSchema.columns);

      expect(mapping['name']).toBe('Company Name');
      expect(mapping['code']).toBe('Customer Code');
      expect(mapping['phone']).toBe('Contact Number');
      expect(mapping['tax_identifier']).toBe('BIN');
      expect(mapping['role']).toBe('Party Role');
    });

    it('validates product sample rows without errors', async () => {
      const { productImportSchema } = await import('../../../modules/catalogue/schemas/productImportSchema');
      const headers = productImportSchema.columns.map((c) => c.key);
      const mapping: Record<string, string> = {};
      headers.forEach((h) => { mapping[h] = h; });

      const sampleRows = productImportSchema.sampleRows!;
      const result = validateImportRows(
        sampleRows,
        mapping,
        productImportSchema.columns,
        productImportSchema.uniqueIdentifierKey
      );

      expect(result.validCount).toBe(sampleRows.length);
      expect(result.invalidCount).toBe(0);
    });

    it('validates party sample rows without errors', async () => {
      const { partyImportSchema } = await import('../../../modules/catalogue/schemas/partyImportSchema');
      const headers = partyImportSchema.columns.map((c) => c.key);
      const mapping: Record<string, string> = {};
      headers.forEach((h) => { mapping[h] = h; });

      const sampleRows = partyImportSchema.sampleRows!;
      const result = validateImportRows(
        sampleRows,
        mapping,
        partyImportSchema.columns,
        partyImportSchema.uniqueIdentifierKey
      );

      expect(result.validCount).toBe(sampleRows.length);
      expect(result.invalidCount).toBe(0);
    });

    it('accurately automaps category, brand, and unit CSV headers', async () => {
      const { categoryImportSchema } = await import('../../../modules/catalogue/schemas/categoryImportSchema');
      const { brandImportSchema } = await import('../../../modules/catalogue/schemas/brandImportSchema');
      const { unitImportSchema } = await import('../../../modules/catalogue/schemas/unitImportSchema');

      const catHeaders = ['Category Code', 'Category Name', 'Parent Category', 'Status'];
      const catMapping = autoMapColumns(catHeaders, categoryImportSchema.columns);
      expect(catMapping['code']).toBe('Category Code');
      expect(catMapping['name']).toBe('Category Name');
      expect(catMapping['parent']).toBe('Parent Category');
      expect(catMapping['is_active']).toBe('Status');

      const brandHeaders = ['Brand Code', 'Brand Name', 'Logo', 'Active'];
      const brandMapping = autoMapColumns(brandHeaders, brandImportSchema.columns);
      expect(brandMapping['code']).toBe('Brand Code');
      expect(brandMapping['name']).toBe('Brand Name');
      expect(brandMapping['logo_path']).toBe('Logo');
      expect(brandMapping['is_active']).toBe('Active');

      const unitHeaders = ['Unit Code', 'Unit Name', 'Family', 'Decimals', 'Base Unit'];
      const unitMapping = autoMapColumns(unitHeaders, unitImportSchema.columns);
      expect(unitMapping['code']).toBe('Unit Code');
      expect(unitMapping['name']).toBe('Unit Name');
      expect(unitMapping['type']).toBe('Family');
      expect(unitMapping['precision']).toBe('Decimals');
      expect(unitMapping['is_base']).toBe('Base Unit');
    });

    it('accurately automaps warehouse, bom, and opening stock CSV headers', async () => {
      const { warehouseImportSchema } = await import('../../../modules/catalogue/schemas/warehouseImportSchema');
      const { bomImportSchema } = await import('../../../modules/catalogue/schemas/bomImportSchema');
      const { openingStockImportSchema } = await import('../../../modules/inventory/schemas/openingStockImportSchema');

      const whHeaders = ['Warehouse Code', 'Warehouse Name', 'Facility Type', 'Physical Address', 'Initial Bins & Racks'];
      const whMapping = autoMapColumns(whHeaders, warehouseImportSchema.columns);
      expect(whMapping['code']).toBe('Warehouse Code');
      expect(whMapping['name']).toBe('Warehouse Name');
      expect(whMapping['type']).toBe('Facility Type');
      expect(whMapping['address']).toBe('Physical Address');
      expect(whMapping['locations']).toBe('Initial Bins & Racks');

      const bomHeaders = ['Finished Product SKU', 'BOM Recipe Name', 'Version', 'Output Yield Quantity', 'Output Unit', 'Raw Material SKU', 'Component Quantity'];
      const bomMapping = autoMapColumns(bomHeaders, bomImportSchema.columns);
      expect(bomMapping['finished_sku']).toBe('Finished Product SKU');
      expect(bomMapping['bom_name']).toBe('BOM Recipe Name');
      expect(bomMapping['version']).toBe('Version');
      expect(bomMapping['output_quantity']).toBe('Output Yield Quantity');
      expect(bomMapping['component_sku']).toBe('Raw Material SKU');
      expect(bomMapping['component_quantity']).toBe('Component Quantity');

      const stockHeaders = ['Product SKU', 'Warehouse Code / Name', 'Opening Quantity', 'Unit Cost Valuation', 'Bin / Rack Location', 'Batch / Lot Number', 'Batch Expiry Date'];
      const stockMapping = autoMapColumns(stockHeaders, openingStockImportSchema.columns);
      expect(stockMapping['sku']).toBe('Product SKU');
      expect(stockMapping['warehouse_code']).toBe('Warehouse Code / Name');
      expect(stockMapping['quantity']).toBe('Opening Quantity');
      expect(stockMapping['unit_cost']).toBe('Unit Cost Valuation');
      expect(stockMapping['location_code']).toBe('Bin / Rack Location');
      expect(stockMapping['batch_code']).toBe('Batch / Lot Number');
      expect(stockMapping['expiry_date']).toBe('Batch Expiry Date');

      // Validate opening stock rows
      const rows = [
        { 'Product SKU': 'SKU-RICE-001', 'Warehouse Code / Name': 'WH-MAIN', 'Opening Quantity': 500, 'Unit Cost Valuation': 40, 'Batch / Lot Number': 'LOT-1', 'Batch Expiry Date': '2027-01-01' },
        { 'Product SKU': '', 'Warehouse Code / Name': 'WH-MAIN', 'Opening Quantity': 500 }, // missing sku
      ];
      const valResult = validateImportRows(rows, stockMapping, openingStockImportSchema.columns, openingStockImportSchema.uniqueIdentifierKey);
      expect(valResult.validCount).toBe(1);
      expect(valResult.invalidCount).toBe(1);
      expect(valResult.parsedRows[1]?.errors['sku']).toBeDefined();
    });

    it('accurately automaps Phase 3 HR schemas (departments, designations, shifts, roster, salary advances)', async () => {
      const { departmentImportSchema } = await import('../../../modules/hr/schemas/departmentImportSchema');
      const { designationImportSchema } = await import('../../../modules/hr/schemas/designationImportSchema');
      const { shiftImportSchema } = await import('../../../modules/hr/schemas/shiftImportSchema');
      const { shiftRosterImportSchema } = await import('../../../modules/hr/schemas/shiftRosterImportSchema');
      const { salaryAdvanceImportSchema } = await import('../../../modules/hr/schemas/salaryAdvanceImportSchema');

      // Departments
      const deptHeaders = ['Department Name', 'Department Code', 'Cost Center Code', 'Is Active'];
      const deptMapping = autoMapColumns(deptHeaders, departmentImportSchema.columns);
      expect(deptMapping['name']).toBe('Department Name');
      expect(deptMapping['code']).toBe('Department Code');
      expect(deptMapping['cost_center_code']).toBe('Cost Center Code');

      // Designations
      const desHeaders = ['Designation / Title', 'Designation Code', 'Pay / Rank Grade', 'Is Active'];
      const desMapping = autoMapColumns(desHeaders, designationImportSchema.columns);
      expect(desMapping['name']).toBe('Designation / Title');
      expect(desMapping['code']).toBe('Designation Code');
      expect(desMapping['grade']).toBe('Pay / Rank Grade');

      // Shifts
      const shiftHeaders = ['Shift Name', 'Shift Code', 'Start Time', 'End Time', 'Break Minutes', 'Grace In Minutes'];
      const shiftMapping = autoMapColumns(shiftHeaders, shiftImportSchema.columns);
      expect(shiftMapping['name']).toBe('Shift Name');
      expect(shiftMapping['code']).toBe('Shift Code');
      expect(shiftMapping['start_time']).toBe('Start Time');
      expect(shiftMapping['end_time']).toBe('End Time');

      // Rosters
      const rosterHeaders = ['Employee Code', 'Shift Code / Name', 'Effective From Date', 'Effective To Date'];
      const rosterMapping = autoMapColumns(rosterHeaders, shiftRosterImportSchema.columns);
      expect(rosterMapping['employee_code']).toBe('Employee Code');
      expect(rosterMapping['shift_code']).toBe('Shift Code / Name');
      expect(rosterMapping['effective_from']).toBe('Effective From Date');

      // Salary Advances
      const advHeaders = ['Employee Code', 'Advance Voucher Number', 'Principal Amount', 'Issue Date', 'Monthly Recovery Installment', 'Advance Status'];
      const advMapping = autoMapColumns(advHeaders, salaryAdvanceImportSchema.columns);
      expect(advMapping['employee_code']).toBe('Employee Code');
      expect(advMapping['advance_number']).toBe('Advance Voucher Number');
      expect(advMapping['amount']).toBe('Principal Amount');
      expect(advMapping['installment_amount']).toBe('Monthly Recovery Installment');
      expect(advMapping['status']).toBe('Advance Status');

      // Validate Advance rows
      const advRows = [
        { 'Employee Code': 'EMP-00101', 'Advance Voucher Number': 'ADV-101', 'Principal Amount': 15000, 'Issue Date': '2026-09-01', 'Advance Status': 'active' },
        { 'Employee Code': '', 'Principal Amount': 10000 }, // missing required employee_code
      ];
      const advVal = validateImportRows(advRows, advMapping, salaryAdvanceImportSchema.columns, salaryAdvanceImportSchema.uniqueIdentifierKey);
      expect(advVal.validCount).toBe(1);
      expect(advVal.invalidCount).toBe(1);
      expect(advVal.parsedRows[1]?.errors['employee_code']).toBeDefined();
    });

    it('correctly maps and validates Phase 4 Commercial & CRM schemas', async () => {
      const { leadImportSchema } = await import('../../../modules/sales/schemas/leadImportSchema');
      const { priceListImportSchema } = await import('../../../modules/sales/schemas/priceListImportSchema');
      const { historicalInvoiceImportSchema } = await import('../../../modules/sales/schemas/historicalInvoiceImportSchema');
      const { salesTargetImportSchema } = await import('../../../modules/sales/schemas/salesTargetImportSchema');

      // 1. CRM Leads
      const leadHeaders = ['Contact Name', 'Company', 'Mobile', 'Email Address', 'Source', 'Stage', 'Expected Deal Value'];
      const leadMapping = autoMapColumns(leadHeaders, leadImportSchema.columns);
      expect(leadMapping['name']).toBe('Contact Name');
      expect(leadMapping['company_name']).toBe('Company');
      expect(leadMapping['phone']).toBe('Mobile');
      expect(leadMapping['email']).toBe('Email Address');
      expect(leadMapping['source']).toBe('Source');
      expect(leadMapping['stage']).toBe('Stage');
      expect(leadMapping['expected_value']).toBe('Expected Deal Value');

      const leadRows = [
        { 'Contact Name': 'Habib Rahman', 'Company': 'Delta Mills', 'Mobile': '+8801700000000', 'Stage': 'qualified' },
        { 'Contact Name': '', 'Company': 'Ghost Corp' }, // missing required name
      ];
      const leadVal = validateImportRows(leadRows, leadMapping, leadImportSchema.columns, leadImportSchema.uniqueIdentifierKey);
      expect(leadVal.validCount).toBe(1);
      expect(leadVal.invalidCount).toBe(1);
      expect(leadVal.parsedRows[1]?.errors['name']).toBeDefined();

      // 2. Customer Price Lists
      const priceHeaders = ['Price List Code', 'Product SKU', 'Unit Price', 'Min Qty Break', 'Discount %'];
      const priceMapping = autoMapColumns(priceHeaders, priceListImportSchema.columns);
      expect(priceMapping['price_list_code']).toBe('Price List Code');
      expect(priceMapping['product_sku']).toBe('Product SKU');
      expect(priceMapping['unit_price']).toBe('Unit Price');
      expect(priceMapping['min_quantity']).toBe('Min Qty Break');
      expect(priceMapping['discount_percentage']).toBe('Discount %');

      const priceRows = [
        { 'Price List Code': 'WHOLESALE', 'Product SKU': 'SKU-JAR-500', 'Unit Price': 145.5, 'Min Qty Break': 50 },
        { 'Price List Code': 'WHOLESALE', 'Product SKU': '', 'Unit Price': 100 }, // missing product_sku
      ];
      const priceVal = validateImportRows(priceRows, priceMapping, priceListImportSchema.columns, priceListImportSchema.uniqueIdentifierKey);
      expect(priceVal.validCount).toBe(1);
      expect(priceVal.invalidCount).toBe(1);
      expect(priceVal.parsedRows[1]?.errors['product_sku']).toBeDefined();

      // 3. Historical Invoices
      const invHeaders = ['Invoice No', 'Customer Code', 'Bill Date', 'Payment Due Date', 'Gross Total', 'Amount Paid', 'Invoice Status'];
      const invMapping = autoMapColumns(invHeaders, historicalInvoiceImportSchema.columns);
      expect(invMapping['invoice_number']).toBe('Invoice No');
      expect(invMapping['customer_code']).toBe('Customer Code');
      expect(invMapping['invoice_date']).toBe('Bill Date');
      expect(invMapping['due_date']).toBe('Payment Due Date');
      expect(invMapping['total_amount']).toBe('Gross Total');
      expect(invMapping['paid_amount']).toBe('Amount Paid');
      expect(invMapping['status']).toBe('Invoice Status');

      const invRows = [
        { 'Invoice No': 'INV-2026-001', 'Customer Code': 'CUST-001', 'Bill Date': '2026-08-01', 'Gross Total': 50000, 'Amount Paid': 20000 },
        { 'Invoice No': '', 'Customer Code': 'CUST-002', 'Gross Total': 30000 }, // missing invoice_number
      ];
      const invVal = validateImportRows(invRows, invMapping, historicalInvoiceImportSchema.columns, historicalInvoiceImportSchema.uniqueIdentifierKey);
      expect(invVal.validCount).toBe(1);
      expect(invVal.invalidCount).toBe(1);
      expect(invVal.parsedRows[1]?.errors['invoice_number']).toBeDefined();

      // 4. Salesman Targets
      const targetHeaders = ['Salesman Code', 'Target Month', 'Campaign Title', 'Target Quota Amount', 'Current Achieved'];
      const targetMapping = autoMapColumns(targetHeaders, salesTargetImportSchema.columns);
      expect(targetMapping['employee_code']).toBe('Salesman Code');
      expect(targetMapping['period_month']).toBe('Target Month');
      expect(targetMapping['target_name']).toBe('Campaign Title');
      expect(targetMapping['target_amount']).toBe('Target Quota Amount');
      expect(targetMapping['achieved_amount']).toBe('Current Achieved');

      const targetRows = [
        { 'Salesman Code': 'EMP-001', 'Target Month': '2026-09', 'Target Quota Amount': 500000, 'Current Achieved': 120000 },
        { 'Salesman Code': '', 'Target Month': '2026-09', 'Target Quota Amount': 300000 }, // missing employee_code
      ];
      const targetVal = validateImportRows(targetRows, targetMapping, salesTargetImportSchema.columns, salesTargetImportSchema.uniqueIdentifierKey);
      expect(targetVal.validCount).toBe(1);
      expect(targetVal.invalidCount).toBe(1);
      expect(targetVal.parsedRows[1]?.errors['employee_code']).toBeDefined();
    });
  });
});
