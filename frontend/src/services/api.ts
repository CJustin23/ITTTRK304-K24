import axios from 'axios';
import {
  DashboardSummary,
  HabitRecommendation,
  Transaction,
  Wallet,
  Category,
  Budget,
  FamilyInvitation,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor gắn JWT token vào mỗi request
api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('budglee_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

export const AuthService = {
  login: async (data: { email: string; password: string }): Promise<{
    token: string;
    type: string;
    id: number;
    fullName: string;
    email: string;
    role: string;
    familyGroupId?: string;
  }> => {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },
  register: async (data: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    familyGroupId?: string;
  }): Promise<{
    token: string;
    type: string;
    id: number;
    fullName: string;
    email: string;
    role: string;
    familyGroupId?: string;
  }> => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },
  forgotPassword: async (email: string): Promise<{ email: string; otp: string; message: string; expiresInSeconds: number }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data.data;
  },
  verifyOtp: async (data: { email: string; otp: string }): Promise<void> => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<void> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data.data;
  },
};

export const DashboardService = {
  getSummary: async (year?: number, month?: number): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary', { params: { year, month } });
    return response.data.data;
  },
  getTrends: async (timeframe?: string): Promise<{ label: string; amount: number }[]> => {
    const response = await api.get('/dashboard/trends', { params: { timeframe } });
    return response.data.data;
  },
  getRecommendations: async (year?: number, month?: number): Promise<HabitRecommendation> => {
    const response = await api.get('/dashboard/recommendations', { params: { year, month } });
    return response.data.data;
  },
};

export const TransactionService = {
  getAll: async (page = 0, size = 100): Promise<{ content: Transaction[]; totalElements: number }> => {
    const response = await api.get('/transactions', { params: { page, size } });
    return response.data.data;
  },
  create: async (data: any): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data.data;
  },
};

export const WalletService = {
  getAll: async (): Promise<Wallet[]> => {
    const response = await api.get('/wallets');
    return response.data.data;
  },
  create: async (data: any): Promise<Wallet> => {
    const response = await api.post('/wallets', data);
    return response.data.data;
  },
  update: async (id: number, data: any): Promise<Wallet> => {
    const response = await api.put(`/wallets/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/wallets/${id}`);
  },
};

export const CategoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.data;
  },
};

export const BudgetService = {
  getAll: async (month: number, year: number): Promise<Budget[]> => {
    const response = await api.get('/budgets', { params: { month, year } });
    return response.data.data;
  },
  create: async (data: any): Promise<Budget> => {
    const response = await api.post('/budgets', data);
    return response.data.data;
  },
};

export interface FamilyUserLookup {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  exists: boolean;
  message?: string;
}

export const FamilyApiService = {
  checkUser: async (email: string): Promise<FamilyUserLookup> => {
    const response = await api.get('/family/check-user', { params: { email } });
    return response.data.data;
  },
  sendInvitation: async (email: string): Promise<FamilyInvitation> => {
    const response = await api.post('/family/invitations', { email });
    return response.data.data;
  },
  getSentInvitations: async (): Promise<FamilyInvitation[]> => {
    const response = await api.get('/family/invitations/sent');
    return response.data.data;
  },
  getReceivedInvitations: async (): Promise<FamilyInvitation[]> => {
    const response = await api.get('/family/invitations/received');
    return response.data.data;
  },
  acceptInvitation: async (invitationId: number): Promise<FamilyInvitation> => {
    const response = await api.post(`/family/invitations/${invitationId}/accept`);
    return response.data.data;
  },
  rejectInvitation: async (invitationId: number): Promise<FamilyInvitation> => {
    const response = await api.post(`/family/invitations/${invitationId}/reject`);
    return response.data.data;
  },
  cancelInvitation: async (invitationId: number): Promise<void> => {
    const response = await api.delete(`/family/invitations/${invitationId}`);
    return response.data.data;
  },
  addDirectMember: async (email: string): Promise<any> => {
    const response = await api.post('/family/members', { email });
    return response.data.data;
  },
  getMembers: async (): Promise<any[]> => {
    const response = await api.get('/family/members');
    return response.data.data;
  },
  removeMember: async (memberId: number): Promise<void> => {
    const response = await api.delete(`/family/members/${memberId}`);
    return response.data.data;
  },
};

export default api;
