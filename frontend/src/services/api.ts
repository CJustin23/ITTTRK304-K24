import axios from 'axios';
import {
  DashboardSummary,
  HabitRecommendation,
  Transaction,
  Wallet,
  Category,
  Budget,
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

export default api;
