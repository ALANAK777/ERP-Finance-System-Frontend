import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// Generate unique payment number
const generatePaymentNumber = async (): Promise<string> => {
  const count = await prisma.payment.count();
  const year = new Date().getFullYear();
  return `PAY-${year}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, invoiceId, startDate, endDate } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (invoiceId) where.invoiceId = String(invoiceId);
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) (where.paymentDate as Record<string, unknown>).gte = new Date(String(startDate));
    if (endDate) (where.paymentDate as Record<string, unknown>).lte = new Date(String(endDate));
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        invoice: { select: { invoiceNumber: true, type: true, total: true } },
        customer: { select: { name: true } },
        vendor: { select: { name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    success: true,
    data: payments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Create payment
// @route   POST /api/payments
// @access  Private/Finance
export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { invoiceId, amount, paymentDate, paymentMethod, reference, currency } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Calculate paid amount
  const paidAmount = invoice.payments.reduce(
    (sum: Decimal, payment: { amount: Decimal }) => sum.plus(new Decimal(payment.amount)),
    new Decimal(0)
  );
  const remainingAmount = new Decimal(invoice.total).minus(paidAmount);

  if (new Decimal(amount).greaterThan(remainingAmount)) {
    throw new AppError(`Payment amount exceeds remaining balance of ${remainingAmount}`, 400);
  }

  const paymentNumber = await generatePaymentNumber();

  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      invoiceId,
      vendorId: invoice.vendorId,
      customerId: invoice.customerId,
      amount,
      currency: currency || invoice.currency,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      reference,
    },
    include: {
      invoice: true,
    },
  });

  // Update invoice status
  const newPaidAmount = paidAmount.plus(amount);
  const newStatus = newPaidAmount.equals(invoice.total) ? 'PAID' : 'PARTIAL';

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
  });

  // Create cash flow record
  await prisma.cashFlow.create({
    data: {
      date: new Date(paymentDate),
      type: invoice.type === 'RECEIVABLE' ? 'INFLOW' : 'OUTFLOW',
      category: invoice.type === 'RECEIVABLE' ? 'Customer Payment' : 'Vendor Payment',
      amount,
      description: `Payment for ${invoice.invoiceNumber}`,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      details: { paymentNumber, invoiceId, amount },
    },
  });

  res.status(201).json({
    success: true,
    data: payment,
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: {
      invoice: { include: { items: true } },
      customer: true,
      vendor: true,
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  res.json({
    success: true,
    data: payment,
  });
});
