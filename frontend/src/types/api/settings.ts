export type SettingValueType = 'string' | 'number' | 'boolean' | 'json' | 'date';

export type SettingValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, unknown>;

export interface SettingFieldSchema {
  label: string;
  type: SettingValueType;
  default: SettingValue;
  sensitive: boolean;
  options?: Array<{ label: string; value: SettingValue }>;
}

export interface SettingGroupSchema {
  title: string;
  description: string;
  settings: Record<string, SettingFieldSchema>;
}

export type SettingsSchemaDictionary = Record<string, SettingGroupSchema>;

export interface SettingItem {
  key: string;
  label: string;
  type: SettingValueType;
  value: SettingValue;
  default: SettingValue;
  sensitive: boolean;
}

export interface SettingGroupResponse {
  group: string;
  settings: Record<string, SettingItem>;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: string;
  status: 'connected' | 'failed';
  latency_ms?: number;
  message: string;
}
