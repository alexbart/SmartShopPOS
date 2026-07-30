export interface RegisterCommand {
  organizationName: string;
  organizationEmail?: string;
  organizationPhone?: string;
  kraPin?: string;

  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone?: string;

  plainPassword: string;
}
