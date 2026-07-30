export interface RegisterOrganizationDTO {
  name: string;
  email?: string;
  phone?: string;
  kraPin?: string;
}

export interface RegisterOwnerDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterDTO {
  organization: RegisterOrganizationDTO;
  owner: RegisterOwnerDTO;
}

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
