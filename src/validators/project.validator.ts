import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    budget: z.number().positive('Budget must be positive'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    budget: z.number().positive().optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const addProgressSchema = z.object({
  body: z.object({
    date: z.string().transform((str) => new Date(str)),
    plannedProgress: z.number().min(0).max(100),
    actualProgress: z.number().min(0).max(100),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
