import api from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post('/auth/login', credentials);
    const user = response.data.data;
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post('/auth/register', data);
    const user = response.data.data;
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
