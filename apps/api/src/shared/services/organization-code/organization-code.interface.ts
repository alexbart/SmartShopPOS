export interface IOrganizationCodeService {
  generate(organizationName: string): Promise<string>;
}
