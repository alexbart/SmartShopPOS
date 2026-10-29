export const TOKENS = {
  PasswordService: Symbol("PasswordService"),
  JwtService: Symbol("JwtService"),
  OrganizationCodeService: Symbol("OrganizationCodeService"),
  AuthRepository: Symbol("AuthRepository"),
  UnitOfWork: Symbol("UnitOfWork"),
} as const;

export type TokenKeys = typeof TOKENS[keyof typeof TOKENS];
