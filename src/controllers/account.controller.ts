import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all accounts (Chart of Accounts)
// @route   GET /api/accounts
// @access  Private
export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const { type, isActive } = req.query;

  const where: Record<string, unknown> = {};
  if (type) where.type = String(type);
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const accounts = await prisma.account.findMany({
    where,
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true } },
    },
    orderBy: { code: 'asc' },
  });

  res.json({
    success: true,
    data: accounts,
  });
});

// @desc    Get account by ID
// @route   GET /api/accounts/:id
// @access  Private
export const getAccountById = asyncHandler(async (req: Request, res: Response) => {
  const account = await prisma.account.findUnique({
    where: { id: req.params.id },
    include: {
      parent: true,
      children: true,
      journalLines: {
        take: 20,
        orderBy: { journalEntry: { date: 'desc' } },
        include: { journalEntry: true },
      },
    },
  });

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  res.json({
    success: true,
    data: account,
  });
});

// @desc    Create account
// @route   POST /api/accounts
// @access  Private/Finance
export const createAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, name, type, parentId, currency } = req.body;

  // Check if code exists
  const existingAccount = await prisma.account.findUnique({
    where: { code },
  });

  if (existingAccount) {
    throw new AppError('Account code already exists', 400);
  }

  const account = await prisma.account.create({
    data: {
      code,
      name,
      type,
      parentId,
      currency: currency || 'USD',
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Account',
      entityId: account.id,
      details: { code, name, type },
    },
  });

  res.status(201).json({
    success: true,
    data: account,
  });
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private/Finance
export const updateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, name, type, parentId, isActive } = req.body;

  const account = await prisma.account.findUnique({
    where: { id: req.params.id },
  });

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  const updatedAccount = await prisma.account.update({
    where: { id: req.params.id },
    data: {
      code: code || account.code,
      name: name || account.name,
      type: type || account.type,
      parentId: parentId !== undefined ? parentId : account.parentId,
      isActive: isActive !== undefined ? isActive : account.isActive,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Account',
      entityId: account.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: updatedAccount,
  });
});

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private/Admin
export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const account = await prisma.account.findUnique({
    where: { id: req.params.id },
    include: { journalLines: true, children: true },
  });

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  if (account.journalLines.length > 0) {
    throw new AppError('Cannot delete account with journal entries', 400);
  }

  if (account.children.length > 0) {
    throw new AppError('Cannot delete account with child accounts', 400);
  }

  await prisma.account.delete({
    where: { id: req.params.id },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Account',
      entityId: account.id,
    },
  });

  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
});
