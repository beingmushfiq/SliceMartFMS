import type { ImportSchemaConfig } from '../../../components/import/types';

export const departmentImportSchema: ImportSchemaConfig = {
  entityTitle: 'Departments',
  templateFileName: 'erp_departments_import_template',
  uniqueIdentifierKey: 'name',
  supportsUpsert: true,
  apiEndpoint: '/hr/departments/bulk-import',
  columns: [
    {
      key: 'name',
      label: 'Department Name',
      required: true,
      type: 'string',
      sampleValue: 'Quality Assurance & Cutting',
      description: 'Full name of the organizational department',
      aliases: ['name', 'department_name', 'department', 'dept_name', 'dept'],
    },
    {
      key: 'code',
      label: 'Department Code',
      required: false,
      type: 'string',
      sampleValue: 'QA-CUT',
      description: 'Unique department alphanumeric identifier (auto-derived if blank)',
      aliases: ['code', 'department_code', 'dept_code', 'short_code'],
    },
    {
      key: 'cost_center_code',
      label: 'Cost Center Code',
      required: false,
      type: 'string',
      sampleValue: 'CC-OPS-01',
      description: 'Associated general ledger cost center code',
      aliases: ['cost_center_code', 'cost_center', 'cost_centre', 'cc_code', 'cost_centre_code'],
    },
    {
      key: 'is_active',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      sampleValue: 'true',
      description: 'True if active, false if inactive/archived',
      aliases: ['is_active', 'active', 'status', 'enabled'],
    },
  ],
};
