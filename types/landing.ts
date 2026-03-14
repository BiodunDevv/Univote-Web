export interface PublicBillingPlan {
  code: "pro" | "pro_plus" | "enterprise";
  name: string;
  rank: number;
  monthly_price_ngn: number;
  monthly_price_kobo: number;
  support_sla: string;
  limits: {
    admins: number;
    students: number;
    active_sessions: number;
  };
  features: string[];
}

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
  plans: PublicBillingPlan[];
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
    primary_identifier: "matric_no" | "email" | "member_id" | "employee_id" | "username";
    allowed_identifiers?: Array<
      "matric_no" | "email" | "member_id" | "employee_id" | "username"
    >;
    recovery_identifiers?: Array<
      "matric_no" | "email" | "member_id" | "employee_id" | "username"
    >;
    display_identifier?: "matric_no" | "email" | "member_id" | "employee_id" | "username";
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
  plan_code: PublicBillingPlan["code"];
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  institution_type: "university" | "college" | "polytechnic" | "faculty" | "organization";
  student_count_estimate?: number;
  admin_count_estimate?: number;
  notes?: string;
  demo_requested: boolean;
}

export interface TenantApplicationResponse {
  message: string;
  action: string;
  checkout_url?: string | null;
  invoice?: {
    id: string;
    invoice_number: string;
    plan_code: string;
    amount_ngn: number;
    amount_kobo: number;
    currency: string;
    interval: string;
    status: string;
    payment_provider: string;
    payment_reference?: string | null;
    provider_checkout_url?: string | null;
    issued_at: string;
    paid_at?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    createdAt: string;
  } | null;
  next_steps: string[];
  application: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan_code: string;
    subscription_status: string;
    contact_email?: string | null;
    application_submitted_at: string;
  };
}
