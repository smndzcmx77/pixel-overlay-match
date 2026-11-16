export type StaffAccessProfile = {
  aprobado: boolean;
};

export function canUsePOS(profile: StaffAccessProfile | null | undefined): boolean {
  return profile?.aprobado === true;
}

export function canManageStaff(
  profile: StaffAccessProfile | null | undefined,
  roles: readonly string[],
): boolean {
  return canUsePOS(profile) && roles.includes("encargado");
}

export function safeStaffRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/pos";
}
