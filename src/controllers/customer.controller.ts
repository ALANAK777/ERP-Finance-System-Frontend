import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        _count: { select: { invoices: true, payments: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    success: true,
    data: customers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      invoices: { take: 10, orderBy: { createdAt: 'desc' } },
      payments: { take: 10, orderBy: { paymentDate: 'desc' } },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: customer,
  });
});

// @desc    Create customer
// @route   POST /api/customers
// @access  Private/Finance
export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, address, taxId, code, creditLimit, paymentTerms } = req.body;

  // Generate code if not provided
  let customerCode = code;
  if (!customerCode) {
    const count = await prisma.customer.count();
    customerCode = `CUST${String(count + 1).padStart(3, '0')}`;
  }

  const customer = await prisma.customer.create({
    data: { code: customerCode, name, email, phone, address, taxId, creditLimit, paymentTerms },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      details: { name },
    },
  });

  res.status(201).json({
    success: true,
    data: customer,
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Finance
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id: req.params.id },
    data: req.body,
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: customer.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: updatedCustomer,
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { invoices: true },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (customer.invoices.length > 0) {
    // Soft delete
    await prisma.customer.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
  } else {
    await prisma.customer.delete({
      where: { id: req.params.id },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Customer',
      entityId: customer.id,
    },
  });

  res.json({
    success: true,
    message: 'Customer deleted successfully',
  });
});
