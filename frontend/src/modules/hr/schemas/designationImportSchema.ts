import type { ImportSchemaConfig } from '../../../components/import/types';

export const designationImportSchema: ImportSchemaConfig = {
  entityTitle: 'Designations & Job Titles',
  templateFileName: 'slicemart_designations_import_template',
  uniqueIdentifierKey: 'name',
  supportsUpsert: true,
  apiEndpoint: '/hr/designations/bulk-import',
  columns: [
    {
      key: 'name',
      label: 'Designation / Title',
      required: true,
      type: 'string',
      sampleValue: 'Senior Pattern Designer',
      description: 'Official corporate position or job title',
      aliases: ['name', 'designation_name', 'designation', 'title', 'job_title', 'role_title'],
    },
    {
      key: 'code',
      label: 'Designation Code',
      required: false,
      type: 'string',
      sampleValue: 'SR-PAT-DES',
      description: 'Short designation identifier (auto-derived if blank)',
      aliases: ['code', 'designation_code', 'title_code', 'short_code'],
    },
    {
      key: 'grade',
      label: 'Pay / Rank Grade',
      required: false,
      type: 'string',
      sampleValue: 'Grade-4',
      description: 'Compensation hierarchy or seniority grade level',
      aliases: ['grade', 'pay_grade', 'level', 'rank', 'seniority_level'],
    },
    {
      key: 'is_active',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      sampleValue: 'true',
      description: 'True if active, false if deprecated',
      aliases: ['is_active', 'active', 'status', 'enabled'],
    },
  ],
};
