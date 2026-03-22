import type { TenantMembership } from "@/types/tenant";

export function hasTenantPermission(
  membership: TenantMembership | null | undefined,
  permission: string,
) {
  if (!membership) return false;
  if (membership.role === "owner") return true;
  return Array.isArray(membership.permissions)
    ? membership.permissions.includes(permission)
    : false;
}

export function hasAnyTenantPermission(
  membership: TenantMembership | null | undefined,
  permissions: string[],
) {
  return permissions.some((permission) =>
    hasTenantPermission(membership, permission),
  );
}

export function canAssignTenantOwnerRole(
  membership: TenantMembership | null | undefined,
) {
  return membership?.role === "owner" || hasTenantPermission(membership, "tenant.manage");
}
