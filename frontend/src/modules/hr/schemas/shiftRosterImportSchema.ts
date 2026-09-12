import type { ImportSchemaConfig } from '../../../components/import/types';

export const shiftRosterImportSchema: ImportSchemaConfig = {
  entityTitle: 'Shift Rosters & Assignments',
  templateFileName: 'slicemart_shift_rosters_import_template',
  uniqueIdentifierKey: 'employee_code',
  supportsUpsert: true,
  apiEndpoint: '/hr/shifts/roster/bulk-import',
  columns: [
    {
      key: 'employee_code',
      label: 'Employee Code',
      required: true,
      type: 'string',
      sampleValue: 'EMP-00101',
      description: 'Employee badge or employee code in staff directory',
      aliases: ['employee_code', 'emp_code', 'code', 'staff_id', 'employee_id'],
    },
    {
      key: 'shift_code',
      label: 'Shift Code / Name',
      required: true,
      type: 'string',
      sampleValue: 'PROD-MORN',
      description: 'Assigned shift code or exact shift name',
      aliases: ['shift_code', 'shift', 'shift_name', 'roster_shift'],
    },
    {
      key: 'effective_from',
      label: 'Effective From Date',
      required: false,
      type: 'date',
      sampleValue: '2026-09-01',
      description: 'Start date of shift roster schedule (defaults to today)',
      aliases: ['effective_from', 'start_date', 'date', 'from_date', 'valid_from'],
    },
    {
      key: 'effective_to',
      label: 'Effective To Date',
      required: false,
      type: 'date',
      sampleValue: '2026-09-30',
      description: 'Optional expiry/end date of this shift roster',
      aliases: ['effective_to', 'end_date', 'to_date', 'valid_to'],
    },
  ],
};
