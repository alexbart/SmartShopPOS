export interface RequestContext {
  userId: string;
  organizationId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
  requestId: string;
}
