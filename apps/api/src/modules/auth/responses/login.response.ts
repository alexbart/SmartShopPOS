export interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    code: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
