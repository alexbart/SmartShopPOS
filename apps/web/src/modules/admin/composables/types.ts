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
  branchId?: string;
  status?: 'active' | 'inactive' | 'pending';
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
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
  userId: string;
  user?: User;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
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
