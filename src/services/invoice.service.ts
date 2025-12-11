import api from '@/lib/api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  vendorId?: string;
  vendor?: { id: string; name: string };
  customerId?: string;
  customer?: { id: string; name: string };
  projectId?: string;
  project?: { id: string; name: string };
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: { invoiceNumber: string; type: string; total: number };
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number;
  isActive: boolean;
  _count?: { invoices: number; payments: number };
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
  paymentTerms: number;
  isActive: boolean;
  _count?: { invoices: number; payments: number };
}

export const invoiceService = {
  // Invoices
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    customerId?: string;
    vendorId?: string;
  }): Promise<{ data: Invoice[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data.data;
  },

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await api.post('/invoices', data);
    return response.data.data;
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  // Payments
  async getPayments(params?: {
    page?: number;
    limit?: number;
    invoiceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Payment[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const response = await api.post('/payments', data);
    return response.data.data;
  },

  // Vendors
  async getVendors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: Vendor[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/vendors', { params });
    return response.data;
  },

  async getVendorById(id: string): Promise<Vendor> {
    const response = await api.get(`/vendors/${id}`);
    return response.data.data;
  },

  async createVendor(data: Partial<Vendor>): Promise<Vendor> {
    const response = await api.post('/vendors', data);
    return response.data.data;
  },

  async updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const response = await api.put(`/vendors/${id}`, data);
    return response.data.data;
  },

  async deleteVendor(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },

  // Customers
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: Customer[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data.data;
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await api.put(`/customers/${id}`, data);
    return response.data.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
