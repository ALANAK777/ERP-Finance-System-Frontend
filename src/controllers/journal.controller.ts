import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// Generate unique entry number
const generateEntryNumber = async (): Promise<string> => {
  const count = await prisma.journalEntry.count();
  const year = new Date().getFullYear();
  return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all journal entries
// @route   GET /api/journal-entries
// @access  Private
export const getJournalEntries = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = String(status);
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(String(startDate));
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(String(endDate));
  }

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        lines: { include: { account: { select: { code: true, name: true } } } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.journalEntry.count({ where }),
  ]);

  res.json({
    success: true,
    data: entries,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get journal entry by ID
// @route   GET /api/journal-entries/:id
// @access  Private
export const getJournalEntryById = asyncHandler(async (req: Request, res: Response) => {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      lines: { include: { account: true } },
    },
  });

  if (!entry) {
    throw new AppError('Journal entry not found', 404);
  }

  res.json({
    success: true,
    data: entry,
  });
});

// @desc    Create journal entry
// @route   POST /api/journal-entries
// @access  Private/Finance
export const createJournalEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, description, lines } = req.body;

  // Validate debits equal credits
  const totalDebits = lines.reduce((sum: number, line: { debit: number }) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum: number, line: { credit: number }) => sum + line.credit, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new AppError('Debits must equal credits', 400);
  }

  const entryNumber = await generateEntryNumber();

  const entry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(date),
      description,
      createdById: req.user!.id,
      lines: {
        create: lines.map((line: { accountId: string; debit: number; credit: number; description?: string }) => ({
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })),
      },
    },
    include: {
      lines: { include: { account: true } },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'JournalEntry',
      entityId: entry.id,
      details: { entryNumber, description },
    },
  });

  res.status(201).json({
    success: true,
    data: entry,
  });
});

// @desc    Approve journal entry
// @route   PUT /api/journal-entries/:id/approve
// @access  Private/Finance Manager
export const approveJournalEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: req.params.id },
    include: { lines: true },
  });

  if (!entry) {
    throw new AppError('Journal entry not found', 404);
  }

  if (entry.status !== 'PENDING' && entry.status !== 'DRAFT') {
    throw new AppError('Entry cannot be approved', 400);
  }

  // Update entry status
  const updatedEntry = await prisma.journalEntry.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    include: { lines: { include: { account: true } } },
  });

  // Update account balances based on account type
  // Debit-normal accounts (ASSET, EXPENSE): Debit ↑, Credit ↓
  // Credit-normal accounts (LIABILITY, EQUITY, REVENUE): Credit ↑, Debit ↓
  for (const line of entry.lines) {
    const account = await prisma.account.findUnique({ where: { id: line.accountId } });
    if (!account) continue;

    const debit = Number(line.debit);
    const credit = Number(line.credit);

    let balanceChange: number;
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      // Debit-normal: debit increases, credit decreases
      balanceChange = debit - credit;
    } else {
      // Credit-normal (LIABILITY, EQUITY, REVENUE): credit increases, debit decreases
      balanceChange = credit - debit;
    }

    await prisma.account.update({
      where: { id: line.accountId },
      data: {
        balance: { increment: balanceChange },
      },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'APPROVE',
      entity: 'JournalEntry',
      entityId: entry.id,
    },
  });

  res.json({
    success: true,
    data: updatedEntry,
  });
});

// @desc    Reject journal entry
// @route   PUT /api/journal-entries/:id/reject
// @access  Private/Finance Manager
export const rejectJournalEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  const entry = await prisma.journalEntry.findUnique({
    where: { id: req.params.id },
  });

  if (!entry) {
    throw new AppError('Journal entry not found', 404);
  }

  const updatedEntry = await prisma.journalEntry.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED' },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'REJECT',
      entity: 'JournalEntry',
      entityId: entry.id,
      details: { reason },
    },
  });

  res.json({
    success: true,
    data: updatedEntry,
  });
});
