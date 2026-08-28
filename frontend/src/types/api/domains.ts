export type DomainType = 'platform_subdomain' | 'custom_primary' | 'custom_alias';
export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type SslStatus = 'pending' | 'active' | 'failed' | 'not_required';

export interface DnsRecordInstruction {
  type: 'TXT' | 'CNAME' | 'A';
  host: string;
  value: string;
  purpose: string;
}

export interface TenantDomainRecord {
  id: number;
  tenant_id: number;
  uuid: string;
  domain: string;
  type: DomainType;
  is_primary: boolean;
  verification_method: 'dns_txt' | 'cname' | 'a_record';
  verification_token: string;
  verification_status: VerificationStatus;
  ssl_status: SslStatus;
  dns_records_expected?: {
    txt_record?: DnsRecordInstruction;
    cname_record?: DnsRecordInstruction;
    a_record?: DnsRecordInstruction;
  };
  dns_records_found?: Array<{ type: string; value: string }>;
  verified_at: string | null;
  activated_at: string | null;
  dns_last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}
