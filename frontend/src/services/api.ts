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
  register: async (data: { fullName: string; email: string; password: string }): Promise<void> => {
    await api.post('/auth/register', { ...data, role: 'INDIVIDUAL_USER' });
  },
  registerFamilyOwner: async (data: { fullName: string; email: string; password: string; familyName: string }): Promise<void> => {
    await api.post('/auth/register/family-owner', data);
  },
  login: async (email: string, password: string): Promise<{ token: string; id: number; fullName: string; email: string; role: import('../types').Role; familyGroupId?: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
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
  getRecommendations: async (year?: number, month?: number): Promise<HabitRecommendation> => {
    const response = await api.get('/dashboard/recommendations', { params: { year, month } });
    return response.data.data;
  },
};

export const TransactionService = {
  getAll: async (page = 0, size = 10): Promise<{ content: Transaction[]; totalElements: number }> => {
    const response = await api.get('/transactions', { params: { page, size } });
    return response.data.data;
  },
  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data.data;
  },
};

export const WalletService = {
  getAll: async (): Promise<Wallet[]> => {
    const response = await api.get('/wallets');
    return response.data.data;
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

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: 'INDIVIDUAL_USER' | 'FAMILY_ADMIN' | 'FAMILY_MEMBER' | 'SYSTEM_ADMIN';
  familyGroupId?: string | null;
  enabled?: boolean;
  createdAt?: string;
}

export interface AdminStats {
  totalAccounts: number;
  disabledAccounts: number;
  familyGroups: number;
  transactionsLast24Hours: number;
}

export interface ChatbotApiKey {
  id: number;
  provider: string;
  maskedKey: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminBackup {
  name: string;
  sizeBytes: number;
  createdAt: string;
}

export const AdminService = {
  getStats: async (): Promise<AdminStats> => (await api.get('/admin/stats')).data.data,
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get('/admin/users');
    return response.data.data;
  },
  updateRole: async (id: number, role: AdminUser['role'], familyGroupId?: string): Promise<AdminUser> => {
    const response = await api.put(`/admin/users/${id}/role`, { role, familyGroupId: familyGroupId || null });
    return response.data.data;
  },
  updateStatus: async (id: number, enabled: boolean): Promise<AdminUser> => {
    const response = await api.put(`/admin/users/${id}/status`, { enabled });
    return response.data.data;
  },
  createFamilyGroup: async (data: { id: string; name: string; ownerId: number }) => {
    const response = await api.post('/admin/family-groups', data);
    return response.data.data;
  },
  getChatbotKeys: async (): Promise<ChatbotApiKey[]> => (await api.get('/admin/chatbot-keys')).data.data,
  createChatbotKey: async (provider: string, key: string): Promise<ChatbotApiKey> => (await api.post('/admin/chatbot-keys', { provider, key })).data.data,
  updateChatbotKey: async (id: number, provider: string, key: string): Promise<ChatbotApiKey> => (await api.put(`/admin/chatbot-keys/${id}`, { provider, key })).data.data,
  toggleChatbotKey: async (id: number, active: boolean): Promise<ChatbotApiKey> => (await api.put(`/admin/chatbot-keys/${id}/status`, { active })).data.data,
  revealChatbotKey: async (id: number): Promise<string> => (await api.get(`/admin/chatbot-keys/${id}/reveal`)).data.data,
  deleteChatbotKey: async (id: number): Promise<void> => { await api.delete(`/admin/chatbot-keys/${id}`); },
  getBackups: async (): Promise<AdminBackup[]> => (await api.get('/admin/backups')).data.data,
  createBackup: async (): Promise<AdminBackup> => (await api.post('/admin/backups')).data.data,
  prepareRestore: async (name: string): Promise<{ token: string; backupName: string; requiredConfirmation: string; expiresInSeconds: number }> => (await api.post(`/admin/backups/${encodeURIComponent(name)}/restore/prepare`)).data.data,
  restoreBackup: async (name: string, token: string, confirmation: string): Promise<void> => { await api.post(`/admin/backups/${encodeURIComponent(name)}/restore`, { token, confirmation }); },
};

export default api;
