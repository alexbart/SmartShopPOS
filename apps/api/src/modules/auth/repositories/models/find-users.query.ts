export type FindUsersQuery = {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  roleId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export interface FindUsersResult {
  items: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    role: string | null;
    branchName: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  pages: number;
}
