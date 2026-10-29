export interface IThemeRepository {
  getByOrganization(_organizationId: string): Promise<OrganizationTheme | null>;
  upsert(_organizationId: string, _data: ThemeData): Promise<OrganizationTheme>;
}

export interface ThemeData {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  themeMode?: string;
  borderRadius?: string;
  fontFamily?: string;
  compactMode?: boolean;
}

export interface OrganizationTheme {
  id: string;
  organizationId: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  themeMode: string;
  borderRadius: string;
  fontFamily: string | null;
  compactMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}
