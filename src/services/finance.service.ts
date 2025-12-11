import api from '@/lib/api';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  parent?: { id: string; code: string; name: string };
  children?: { id: string; code: string; name: string }[];
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy: { firstName: string; lastName: string };
  lines: JournalLine[];
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  account: { code: string; name: string };
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalEntry {
  date: string;
  description: string;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }[];
}

export const financeService = {
  // Accounts
  async getAccounts(params?: { type?: string; isActive?: boolean }): Promise<Account[]> {
    const response = await api.get('/accounts', { params });
    return response.data.data;
  },

  async getAccountById(id: string): Promise<Account> {
    const response = await api.get(`/accounts/${id}`);
    return response.data.data;
  },

  async createAccount(data: Partial<Account>): Promise<Account> {
    const response = await api.post('/accounts', data);
    return response.data.data;
  },

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data.data;
  },

  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },

  // Journal Entries
  async getJournalEntries(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: JournalEntry[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/journal-entries', { params });
    return response.data;
  },

  async getJournalEntryById(id: string): Promise<JournalEntry> {
    const response = await api.get(`/journal-entries/${id}`);
    return response.data.data;
  },

  async createJournalEntry(data: CreateJournalEntry): Promise<JournalEntry> {
    const response = await api.post('/journal-entries', data);
    return response.data.data;
  },

  async approveJournalEntry(id: string): Promise<JournalEntry> {
    const response = await api.put(`/journal-entries/${id}/approve`);
    return response.data.data;
  },

  async rejectJournalEntry(id: string, reason: string): Promise<JournalEntry> {
    const response = await api.put(`/journal-entries/${id}/reject`, { reason });
    return response.data.data;
  },
};
