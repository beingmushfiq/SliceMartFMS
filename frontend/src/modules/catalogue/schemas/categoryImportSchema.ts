import type { ImportSchemaConfig } from '../../../components/import/types';

export const categoryImportSchema: ImportSchemaConfig = {
  entityTitle: 'Categories',
  templateFileName: 'slicemart_categories_import_template',
  uniqueIdentifierKey: 'code',
  supportsUpsert: true,
  apiEndpoint: '/categories/bulk-import',
  columns: [
    {
      key: 'code',
      label: 'Category Code',
      required: false,
      type: 'string',
      sampleValue: 'CAT-ELEC',
      description: 'Unique category code. Leave blank to auto-generate',
      aliases: ['category_code', 'cat_code', 'code', 'slug'],
    },
    {
      key: 'name',
      label: 'Category Name',
      required: true,
      type: 'string',
      sampleValue: 'Electronics & Gadgets',
      description: 'Full name of the category',
      aliases: ['category_name', 'category', 'title', 'name'],
    },
    {
      key: 'parent',
      label: 'Parent Category',
      required: false,
      type: 'string',
      sampleValue: 'Home & Living',
      description: 'Parent category code or exact name for subcategory nesting',
      aliases: ['parent_category', 'parent_code', 'parent_name', 'parent', 'sub_of'],
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
