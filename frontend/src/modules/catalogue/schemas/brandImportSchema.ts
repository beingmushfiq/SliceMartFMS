import type { ImportSchemaConfig } from '../../../components/import/types';

export const brandImportSchema: ImportSchemaConfig = {
  entityTitle: 'Brands',
  templateFileName: 'slicemart_brands_import_template',
  uniqueIdentifierKey: 'code',
  supportsUpsert: true,
  apiEndpoint: '/brands/bulk-import',
  columns: [
    {
      key: 'code',
      label: 'Brand Code',
      required: false,
      type: 'string',
      sampleValue: 'BRD-SAMSUNG',
      description: 'Unique brand code. Leave blank to auto-generate',
      aliases: ['brand_code', 'code', 'slug', 'id'],
    },
    {
      key: 'name',
      label: 'Brand Name',
      required: true,
      type: 'string',
      sampleValue: 'Samsung Electronics',
      description: 'Full brand or manufacturer name',
      aliases: ['brand_name', 'brand', 'make', 'manufacturer', 'title'],
    },
    {
      key: 'logo_path',
      label: 'Logo File Path',
      required: false,
      type: 'string',
      sampleValue: 'brands/samsung.png',
      description: 'Optional storage disk relative path for logo asset',
      aliases: ['logo', 'logo_path', 'image', 'icon'],
    },
    {
      key: 'is_active',
      label: 'Active Status',
      required: false,
      type: 'boolean',
      sampleValue: true,
      description: 'TRUE or FALSE (defaults to TRUE)',
      aliases: ['status', 'active', 'is_active', 'enabled'],
    },
  ],
};
