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
