import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
  _count?: { users: number };
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: { email: string; firstName: string; lastName: string };
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: User[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: { email: string; firstName: string; lastName: string; password: string; role: string }): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getRoles(): Promise<Role[]> {
    const response = await api.get('/users/roles');
    return response.data.data;
  },

  async createRole(data: { name: string; description?: string; permissionIds?: string[] }): Promise<Role> {
    const response = await api.post('/users/roles', data);
    return response.data.data;
  },

  async updateRole(id: string, data: { name?: string; description?: string; permissionIds?: string[] }): Promise<Role> {
    const response = await api.put(`/users/roles/${id}`, data);
    return response.data.data;
  },

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/users/roles/${id}`);
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await api.get('/users/permissions');
    return response.data.data;
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    entity?: string;
    action?: string;
  }): Promise<{ data: AuditLog[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/users/audit-logs', { params });
    return response.data;
  },
};
