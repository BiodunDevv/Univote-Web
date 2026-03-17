export interface LandingTestimonial {
  id: string;
  tenant_id?: string | null;
  author_name: string;
  author_role: string;
  institution_name: string;
  quote: string;
  avatar_url?: string | null;
  rating: number;
  source: "seed" | "platform" | "tenant" | "public";
  status: "draft" | "pending_review" | "published" | "rejected";
  highlighted: boolean;
  sort_order: number;
  published_at?: string | null;
  rejected_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PublicLandingResponse {
  stats: {
    active_tenants: number;
    active_students: number;
    accepted_votes: number;
  };
  testimonials: LandingTestimonial[];
}

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  primary_domain?: string | null;
  branding?: {
    logo_url?: string | null;
    primary_color?: string;
    accent_color?: string;
    support_email?: string | null;
  };
  labels?: {
    participant_singular: string;
    participant_plural: string;
  };
  identity?: {
    primary_identifier:
      | "matric_no"
      | "email"
      | "member_id"
      | "employee_id"
      | "username";
    allowed_identifiers?: Array<
      "matric_no" | "email" | "member_id" | "employee_id" | "username"
    >;
    recovery_identifiers?: Array<
      "matric_no" | "email" | "member_id" | "employee_id" | "username"
    >;
    display_identifier?:
      | "matric_no"
      | "email"
      | "member_id"
      | "employee_id"
      | "username";
    login?: {
      key: "matric_no" | "email" | "member_id" | "employee_id" | "username";
      label: string;
      placeholder: string;
    };
  };
}

export interface TenantApplicationPayload {
  institution_name: string;
  slug: string;
  primary_domain?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  institution_type:
    | "university"
    | "college"
    | "polytechnic"
    | "faculty"
    | "organization";
  student_count_estimate?: number;
  admin_count_estimate?: number;
  notes?: string;
  demo_requested: boolean;
}

export interface TenantApplicationStatusTimelineItem {
  status: string;
  label?: string | null;
  note?: string | null;
  at: string;
}

export interface TenantApplicationResponse {
  message: string;
  application: {
    id: string;
    reference?: string | null;
    name: string;
    slug: string;
    status: string;
    contact_email?: string | null;
    status_timeline?: TenantApplicationStatusTimelineItem[];
    application_submitted_at: string;
    application_last_updated_at?: string;
    approved_at?: string | null;
    rejected_at?: string | null;
    rejection_reason?: string | null;
  };
}

export interface TenantApplicationStatusResponse {
  application: TenantApplicationResponse["application"];
  next_actions: Array<{
    key: string;
    label: string;
    href?: string | null;
  }>;
}
