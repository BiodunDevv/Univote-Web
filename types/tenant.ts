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
  plan_code?: string;
  branding?: TenantBranding;
  labels?: TenantLabelsSettings;
  identity?: TenantIdentitySettings;
  auth_policy?: TenantAuthPolicySettings;
  participant_fields?: Record<string, TenantParticipantFieldPolicy>;
  eligibility_policy?: TenantEligibilityPolicy;
  entitlements?: TenantFeatureEntitlements;
  onboarding?: {
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    student_count_estimate?: number | null;
    admin_count_estimate?: number | null;
    application_submitted_at?: string | null;
    activated_at?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    rejection_reason?: string | null;
    status_timeline?: Array<{
      status: string;
      label: string;
      note?: string | null;
      at: string;
    }>;
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
  plan_code?: string;
}
