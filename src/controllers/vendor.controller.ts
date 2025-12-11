import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
export const getVendors = asyncHandler(async (req: Request, res: Response) => {
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

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        _count: { select: { invoices: true, payments: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.count({ where }),
  ]);

  res.json({
    success: true,
    data: vendors,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
export const getVendorById = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    include: {
      invoices: { take: 10, orderBy: { createdAt: 'desc' } },
      payments: { take: 10, orderBy: { paymentDate: 'desc' } },
    },
  });

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  res.json({
    success: true,
    data: vendor,
  });
});

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private/Finance
export const createVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, address, taxId, code, paymentTerms } = req.body;

  // Generate code if not provided
  let vendorCode = code;
  if (!vendorCode) {
    const count = await prisma.vendor.count();
    vendorCode = `VEND${String(count + 1).padStart(3, '0')}`;
  }

  const vendor = await prisma.vendor.create({
    data: { code: vendorCode, name, email, phone, address, taxId, paymentTerms },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Vendor',
      entityId: vendor.id,
      details: { name },
    },
  });

  res.status(201).json({
    success: true,
    data: vendor,
  });
});

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private/Finance
export const updateVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
  });

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  const updatedVendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: req.body,
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Vendor',
      entityId: vendor.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: updatedVendor,
  });
});

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
export const deleteVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    include: { invoices: true },
  });

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  if (vendor.invoices.length > 0) {
    // Soft delete
    await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
  } else {
    await prisma.vendor.delete({
      where: { id: req.params.id },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Vendor',
      entityId: vendor.id,
    },
  });

  res.json({
    success: true,
    message: 'Vendor deleted successfully',
  });
});
