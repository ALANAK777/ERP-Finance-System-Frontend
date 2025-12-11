import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    type: z.enum(['RECEIVABLE', 'PAYABLE']),
    vendorId: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    issueDate: z.string().optional().transform((str) => str ? new Date(str) : new Date()),
    dueDate: z.string().transform((str) => new Date(str)),
    currency: z.string().default('USD'),
    items: z.array(z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.union([z.number(), z.string()]).transform((val) => Number(val)),
      unitPrice: z.union([z.number(), z.string()]).transform((val) => Number(val)),
    })).min(1, 'At least one item is required'),
  }),
});

export const createPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string(),
    amount: z.number().positive('Amount must be positive'),
    paymentDate: z.string().transform((str) => new Date(str)),
    paymentMethod: z.string().optional(),
    reference: z.string().optional(),
    currency: z.string().default('USD'),
  }),
});

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
  }),
});
