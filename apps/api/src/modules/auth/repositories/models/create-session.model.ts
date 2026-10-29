export interface CreateSessionModel {
  organizationId: string;
  userId: string;
  branchId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
