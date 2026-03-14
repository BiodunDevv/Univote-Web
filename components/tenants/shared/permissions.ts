"use client";

export function hasTenantPermission(
  permissions: string[] | undefined | null,
  required: string[],
) {
  const values = permissions || [];
  return required.some((permission) => values.includes(permission));
}
