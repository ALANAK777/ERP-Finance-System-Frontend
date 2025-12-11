import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// Generate unique journal entry number
const generateJournalEntryNumber = async (): Promise<string> => {
  const count = await prisma.journalEntry.count();
  const year = new Date().getFullYear();
  return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
};

// Create revenue recognition journal entry for completed project
const createProjectRevenueEntry = async (
  projectId: string,
  projectName: string,
  budget: Decimal,
  userId: string
) => {
  // Get Accounts Receivable (1100) and Service Revenue (4100) accounts
  const arAccount = await prisma.account.findUnique({ where: { code: '1100' } });
  const revenueAccount = await prisma.account.findUnique({ where: { code: '4100' } });

  if (!arAccount || !revenueAccount) {
    console.error('Required accounts not found for revenue recognition');
    return null;
  }

  const entryNumber = await generateJournalEntryNumber();
  const budgetAmount = Number(budget);

  // Create journal entry: Debit AR, Credit Revenue
  const journalEntry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(),
      description: `Revenue recognition for completed project: ${projectName}`,
      createdById: userId,
      status: 'APPROVED', // Auto-approve project completion entries
      approvedAt: new Date(),
      lines: {
        create: [
          {
            accountId: arAccount.id,
            debit: budgetAmount,
            credit: 0,
            description: `Project ${projectName} - Accounts Receivable`,
          },
          {
            accountId: revenueAccount.id,
            debit: 0,
            credit: budgetAmount,
            description: `Project ${projectName} - Service Revenue`,
          },
        ],
      },
    },
    include: { lines: true },
  });

  // Update account balances (since entry is auto-approved)
  await prisma.account.update({
    where: { id: arAccount.id },
    data: { balance: { increment: budgetAmount } },
  });

  await prisma.account.update({
    where: { id: revenueAccount.id },
    data: { balance: { increment: budgetAmount } }, // Revenue increases with credits
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entity: 'JournalEntry',
      entityId: journalEntry.id,
      details: {
        type: 'PROJECT_REVENUE_RECOGNITION',
        projectId,
        amount: budgetAmount,
      },
    },
  });

  return journalEntry;
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = String(status);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        _count: { select: { invoices: true, progress: true, riskLogs: true } },
        progress: { take: 1, orderBy: { date: 'desc' } },
        riskLogs: { take: 1, orderBy: { calculatedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      invoices: { take: 10, orderBy: { createdAt: 'desc' } },
      progress: { orderBy: { date: 'desc' } },
      riskLogs: { take: 5, orderBy: { calculatedAt: 'desc' } },
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.json({
    success: true,
    data: project,
  });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, startDate, endDate, budget, code, location } = req.body;

  // Generate code if not provided
  let projectCode = code;
  if (!projectCode) {
    const count = await prisma.project.count();
    projectCode = `PRJ${String(count + 1).padStart(3, '0')}`;
  }

  const project = await prisma.project.create({
    data: {
      code: projectCode,
      name,
      description,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      budget,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      details: { name, budget },
    },
  });

  res.status(201).json({
    success: true,
    data: project,
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Convert date strings to Date objects if present
  const updateData = { ...req.body };
  if (updateData.startDate && typeof updateData.startDate === 'string') {
    updateData.startDate = new Date(updateData.startDate);
  }
  if (updateData.endDate && typeof updateData.endDate === 'string') {
    updateData.endDate = new Date(updateData.endDate);
  }

  // Check if status is being changed to COMPLETED
  const isCompletingProject = 
    updateData.status === 'COMPLETED' && project.status !== 'COMPLETED';

  const updatedProject = await prisma.project.update({
    where: { id: req.params.id },
    data: updateData,
  });

  // Create revenue recognition journal entry when project is completed
  if (isCompletingProject) {
    const journalEntry = await createProjectRevenueEntry(
      project.id,
      project.name,
      project.budget,
      req.user!.id
    );

    if (journalEntry) {
      console.log(`Revenue recognition entry ${journalEntry.entryNumber} created for project ${project.name}`);
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Project',
      entityId: project.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: updatedProject,
  });
});

// @desc    Add project progress
// @route   POST /api/projects/:id/progress
// @access  Private
export const addProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, plannedProgress, actualProgress, notes } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const progress = await prisma.projectProgress.create({
    data: {
      projectId: req.params.id,
      date: new Date(date),
      plannedProgress,
      actualProgress,
      notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'ADD_PROGRESS',
      entity: 'Project',
      entityId: project.id,
      details: { plannedProgress, actualProgress },
    },
  });

  res.status(201).json({
    success: true,
    data: progress,
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { invoices: true },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.invoices.length > 0) {
    throw new AppError('Cannot delete project with invoices', 400);
  }

  // Delete related records first
  await prisma.projectProgress.deleteMany({ where: { projectId: req.params.id } });
  await prisma.riskLog.deleteMany({ where: { projectId: req.params.id } });
  await prisma.project.delete({ where: { id: req.params.id } });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Project',
      entityId: project.id,
    },
  });

  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
});
