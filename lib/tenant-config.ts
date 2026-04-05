import type { TenantContext } from "@/types/tenant";

const DEFAULT_LOGIN = {
  key: "email",
  label: "Email Address",
  placeholder: "name@organization.org",
} as const;

export function getTenantParticipantLabels(tenant?: TenantContext | null) {
  return {
    singular: tenant?.labels?.participant_singular || "Student",
    plural: tenant?.labels?.participant_plural || "Students",
  };
}

export function getTenantLoginIdentifier(tenant?: TenantContext | null) {
  return {
    ...DEFAULT_LOGIN,
    key: "email",
  };
}

export function getTenantDisplayIdentifierKey(tenant?: TenantContext | null) {
  return tenant?.identity?.display_identifier || "matric_no";
}

export function getTenantRecoveryIdentifierLabels(
  tenant?: TenantContext | null,
) {
  return ["Email Address"];
}

export function getTenantParticipantFields(tenant?: TenantContext | null) {
  return tenant?.participant_fields || {};
}

export function getTenantParticipantField(
  tenant: TenantContext | null | undefined,
  fieldKey: string,
) {
  return getTenantParticipantFields(tenant)[fieldKey];
}

export function isTenantParticipantFieldEnabled(
  tenant: TenantContext | null | undefined,
  fieldKey: string,
) {
  return getTenantParticipantField(tenant, fieldKey)?.enabled !== false;
}

export function isTenantParticipantFieldRequired(
  tenant: TenantContext | null | undefined,
  fieldKey: string,
) {
  const field = getTenantParticipantField(tenant, fieldKey);
  return Boolean(field?.enabled !== false && field?.required);
}

export function shouldShowTenantParticipantFieldInProfile(
  tenant: TenantContext | null | undefined,
  fieldKey: string,
) {
  return Boolean(getTenantParticipantField(tenant, fieldKey)?.show_in_profile);
}

export function shouldShowTenantParticipantFieldInFilters(
  tenant: TenantContext | null | undefined,
  fieldKey: string,
) {
  return Boolean(getTenantParticipantField(tenant, fieldKey)?.show_in_filters);
}

export function isTenantEligibilityDimensionEnabled(
  tenant: TenantContext | null | undefined,
  fieldKey: "college" | "department" | "level",
) {
  const field = getTenantParticipantField(tenant, fieldKey);
  return Boolean(field?.enabled !== false && field?.allow_in_eligibility);
}

export function formatParticipantIdentifier(
  participant: Record<string, unknown> | null | undefined,
  tenant?: TenantContext | null,
) {
  if (!participant) return null;

  const key = getTenantDisplayIdentifierKey(tenant);
  const value = participant[key];

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const fallbackKeys = [
    "display_identifier",
    "matric_no",
    "email",
  ];

  for (const fallbackKey of fallbackKeys) {
    const fallbackValue = participant[fallbackKey];
    if (typeof fallbackValue === "string" && fallbackValue.trim()) {
      return fallbackValue;
    }
  }

  return null;
}
