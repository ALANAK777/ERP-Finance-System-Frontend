import { z } from 'zod';

export const createAccountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Account code is required'),
    name: z.string().min(1, 'Account name is required'),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
    parentId: z.string().optional(),
    currency: z.string().default('USD'),
  }),
});

export const updateAccountSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const createJournalEntrySchema = z.object({
  body: z.object({
    date: z.string().transform((str) => new Date(str)),
    description: z.string().min(1, 'Description is required'),
    lines: z.array(z.object({
      accountId: z.string(),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      description: z.string().optional(),
    })).min(2, 'At least 2 lines are required'),
  }),
});
