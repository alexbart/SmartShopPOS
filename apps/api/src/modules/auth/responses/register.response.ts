export interface RegisteredOrganization {
  id: string;
  code: string;
  name: string;
}

export interface RegisteredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  organization: RegisteredOrganization;
  user: RegisteredUser;
  tokens: AuthTokens;
}
