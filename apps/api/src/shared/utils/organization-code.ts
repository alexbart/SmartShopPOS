export function generateOrganizationCode(organizationName: string): string {
  const base = organizationName
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.slice(0, 6).toUpperCase())
    .join('-')
    .slice(0, 20);

  return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
