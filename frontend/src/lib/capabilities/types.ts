export interface ModuleCapability {
  enabled: boolean;
  plan_allowed: boolean;
  config?: Record<string, unknown>;
}

export interface ProductionStageConfig {
  id?: number;
  key: string;
  label: string;
  sort_order: number;
  is_qc_stage: boolean;
  requires_worker_tracking?: boolean;
  requires_machine_tracking?: boolean;
}

export interface CustomFieldDefinitionRecord {
  uuid?: string;
  id?: number;
  key: string;
  label: string;
  field_type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'currency'
    | 'percentage'
    | 'date'
    | 'datetime'
    | 'time'
    | 'select'
    | 'multi_select'
    | 'radio'
    | 'checkbox'
    | 'toggle'
    | 'file'
    | 'image'
    | 'url'
    | 'email'
    | 'phone'
    | 'barcode'
    | 'qr';
  options?: Array<{ label: string; value: string | number }> | string[];
  validation_rules?: Record<string, unknown>;
  is_required: boolean;
  default_value?: unknown;
  placeholder?: string;
  help_text?: string;
  visibility_rules?: Record<string, unknown>;
  sort_order: number;
}

export interface TenantCapabilityManifest {
  tenant_id: number;
  tenant_uuid: string;
  tenant_name: string;
  business_type_keys: string[];
  industry_profile_key: string;
  manufacturing_type: string;
  currency_code: string;
  timezone: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  modules: Record<string, ModuleCapability>;
  terminology: Record<string, string>;
  production_stages: ProductionStageConfig[];
  custom_fields: Record<string, CustomFieldDefinitionRecord[]>;
  feature_flags: Record<string, boolean>;
}

export interface IndustryProfileTemplate {
  id: number;
  key: string;
  label: string;
  business_type_keys: string[];
  description: string;
  icon: string;
  recommended_modules: string[];
  default_terminology: Record<string, string>;
  default_production_stages: ProductionStageConfig[];
  default_units: string[];
  qc_template_config: Array<{ name: string; input_type: string; is_required: boolean }>;
  default_custom_fields: Array<{ module: string; entity: string; internal_key: string; label: string; field_type: string }>;
  sort_order: number;
  is_active: boolean;
}

export interface BusinessTypeRecord {
  id: number;
  key: string;
  label: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}
