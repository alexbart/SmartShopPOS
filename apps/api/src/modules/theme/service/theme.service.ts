import type {
  IThemeRepository,
  ThemeData,
  OrganizationTheme,
} from '../repository/theme.repository.js';

export class ThemeService {
  constructor(private readonly _themeRepository: IThemeRepository) {}

  async getTheme(organizationId: string): Promise<OrganizationTheme | null> {
    return this._themeRepository.getByOrganization(organizationId);
  }

  async saveTheme(organizationId: string, data: ThemeData): Promise<OrganizationTheme> {
    return this._themeRepository.upsert(organizationId, data);
  }
}
