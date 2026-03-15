export interface TenantBranding {
  primary_color?: string;
  accent_color?: string;
  logo_url?: string | null;
  support_email?: string | null;
}

export interface TenantLabelsSettings {
  participant_singular: string;
  participant_plural: string;
}

export interface TenantIdentifierMetadata {
  key: "matric_no" | "email" | "member_id" | "employee_id" | "username";
  label: string;
  placeholder: string;
}

export interface TenantIdentitySettings {
  primary_identifier: TenantIdentifierMetadata["key"];
  allowed_identifiers: TenantIdentifierMetadata["key"][];
  recovery_identifiers: TenantIdentifierMetadata["key"][];
  display_identifier: TenantIdentifierMetadata["key"];
  login?: TenantIdentifierMetadata;
  display?: TenantIdentifierMetadata;
  recovery?: TenantIdentifierMetadata[];
}

export interface TenantAuthPolicySettings {
  require_email?: boolean;
  require_photo?: boolean;
  require_face_verification?: boolean;
}

export interface TenantParticipantFieldPolicy {
  key?: string;
  label?: string;
  enabled?: boolean;
  required?: boolean;
  show_in_profile?: boolean;
  show_in_filters?: boolean;
  allow_in_eligibility?: boolean;
}

export interface TenantEligibilityPolicy {
  college?: boolean;
  department?: boolean;
  level?: boolean;
}

export interface TenantFeatureEntitlements {
  custom_terminology?: boolean;
  custom_identity_policy?: boolean;
  custom_participant_structure?: boolean;
  custom_branding?: boolean;
  advanced_analytics?: boolean;
  advanced_reports?: boolean;
  realtime_support?: boolean;
  push_notifications?: boolean;
  face_verification?: boolean;
  quotas?: {
    admins?: number;
    students?: number;
    active_sessions?: number;
  };
  support_sla?: string;
}

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  primary_domain?: string | null;
  status?: string;
  subscription_status?: string;
  plan_code?: string;
  branding?: TenantBranding;
  labels?: TenantLabelsSettings;
  identity?: TenantIdentitySettings;
  auth_policy?: TenantAuthPolicySettings;
  participant_fields?: Record<string, TenantParticipantFieldPolicy>;
  eligibility_policy?: TenantEligibilityPolicy;
  entitlements?: TenantFeatureEntitlements;
  billing?: {
    billing_cycle?: string;
    currency?: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    grace_ends_at?: string | null;
    last_payment_at?: string | null;
    next_plan_code?: string | null;
    next_plan_effective_at?: string | null;
    next_plan_requested_at?: string | null;
  };
}

export interface TenantMembership {
  id?: string;
  role: string;
  permissions: string[];
}

export interface TenantOrganization {
  tenant_id: string;
  name: string;
  slug: string;
  role: string;
  linked?: boolean;
  linked_admin_id?: string;
  link_id?: string;
  label?: string | null;
  primary_domain?: string | null;
  status?: string;
  subscription_status?: string;
  plan_code?: string;
}
