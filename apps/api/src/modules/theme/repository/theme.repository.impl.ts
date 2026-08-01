import { PrismaClient } from '@prisma/client';
import type { IThemeRepository, ThemeData, OrganizationTheme } from './theme.repository.js';

export class ThemeRepositoryImpl implements IThemeRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async getByOrganization(organizationId: string): Promise<OrganizationTheme | null> {
    const theme = await this._prisma.organizationTheme.findUnique({
      where: { organizationId },
    });

    if (!theme) return null;

    return {
      id: theme.id,
      organizationId: theme.organizationId,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      logoUrl: theme.logoUrl,
      faviconUrl: theme.faviconUrl,
      themeMode: theme.themeMode ?? 'light',
      borderRadius: theme.borderRadius ?? '0.5rem',
      fontFamily: theme.fontFamily,
      compactMode: theme.compactMode ?? false,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    };
  }

  async upsert(organizationId: string, data: ThemeData): Promise<OrganizationTheme> {
    const theme = await this._prisma.organizationTheme.upsert({
      where: { organizationId },
      update: { ...data },
      create: { organizationId, ...data },
    });

    return {
      id: theme.id,
      organizationId: theme.organizationId,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      logoUrl: theme.logoUrl,
      faviconUrl: theme.faviconUrl,
      themeMode: theme.themeMode ?? 'light',
      borderRadius: theme.borderRadius ?? '0.5rem',
      fontFamily: theme.fontFamily,
      compactMode: theme.compactMode ?? false,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    };
  }
}
