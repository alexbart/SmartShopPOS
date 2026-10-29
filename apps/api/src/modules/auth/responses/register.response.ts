export interface RegisterResponse {
  organization: {
    id: string;
    code: string;
    name: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
