export interface Organization {
  id: string;
  name: string;
  code: string;
  businessName?: string;
  tagline?: string;
  businessType?: string;
  email?: string;
  phone?: string;
  kraPin?: string;
  vatNumber?: string;
  currency?: string;
  timezone?: string;
  website?: string;
  receiptFooter?: string;
  logoUrl?: string;
  faviconUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  branch?: string;
  branchName?: string;
  branchId?: string;
  status?: 'active' | 'inactive' | 'pending' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  userCount?: number;
  permissions: Permission[];
  _count?: { users: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  employeeCount?: number;
  status?: 'OPEN' | 'CLOSED';
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tax {
  id: string;
  code: string;
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuditEntry {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: {
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
    branch?: { id: string; name: string } | null;
    route?: string | null;
    method?: string | null;
    outcome?: string;
    summary?: string | null;
    previousHash?: string | null;
    eventHash?: string | null;
    roles?: string[];
  };
  requestId?: string | null;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  status: 'configured' | 'connected' | 'not_configured' | 'disabled';
  description?: string;
  config?: Record<string, any>;
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'disabled';
  details?: string;
}
