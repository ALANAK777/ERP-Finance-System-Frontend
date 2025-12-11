import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// Generate unique invoice number
const generateInvoiceNumber = async (type: string): Promise<string> => {
  const prefix = type === 'RECEIVABLE' ? 'INV' : 'BILL';
  const count = await prisma.invoice.count({ where: { type: type as 'RECEIVABLE' | 'PAYABLE' } });
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
};

// Generate unique journal entry number
const generateJournalEntryNumber = async (): Promise<string> => {
  const count = await prisma.journalEntry.count();
  const year = new Date().getFullYear();
  return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, type, status, customerId, vendorId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (type) where.type = String(type);
  if (status) where.status = String(status);
  if (customerId) where.customerId = String(customerId);
  if (vendorId) where.vendorId = String(vendorId);

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        customer: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { payments: true, items: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({
    success: true,
    data: invoices,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      vendor: true,
      project: true,
      items: true,
      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  res.json({
    success: true,
    data: invoice,
  });
});

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private/Finance
export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, vendorId, customerId, projectId, issueDate, dueDate, currency, items } = req.body;

  // Calculate totals
  let subtotal = new Decimal(0);
  const processedItems = items.map((item: { description: string; quantity: number; unitPrice: number }) => {
    const amount = new Decimal(item.quantity).times(item.unitPrice);
    subtotal = subtotal.plus(amount);
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
    };
  });

  const tax = subtotal.times(0); // No tax for now, can be configured
  const total = subtotal.plus(tax);

  const invoiceNumber = await generateInvoiceNumber(type);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      type,
      vendorId,
      customerId,
      projectId,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      subtotal,
      tax,
      total,
      currency: currency || 'USD',
      items: {
        create: processedItems,
      },
    },
    include: {
      items: true,
      customer: true,
      vendor: true,
    },
  });

  // Create journal entry for invoice
  // For RECEIVABLE (Customer Invoice): Debit AR, Credit Revenue
  // For PAYABLE (Vendor Bill): Debit Expense, Credit AP
  const arAccount = await prisma.account.findUnique({ where: { code: '1100' } }); // Accounts Receivable
  const apAccount = await prisma.account.findUnique({ where: { code: '2000' } }); // Accounts Payable
  const revenueAccount = await prisma.account.findUnique({ where: { code: '4100' } }); // Service Revenue
  const cogsAccount = await prisma.account.findUnique({ where: { code: '5000' } }); // Cost of Goods Sold

  const totalNum = Number(total);

  if (type === 'RECEIVABLE' && arAccount && revenueAccount) {
    const entryNumber = await generateJournalEntryNumber();
    await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(issueDate),
        description: `Invoice ${invoiceNumber} - Customer billing`,
        createdById: req.user!.id,
        status: 'APPROVED',
        approvedAt: new Date(),
        lines: {
          create: [
            { accountId: arAccount.id, debit: totalNum, credit: 0, description: `AR - ${invoiceNumber}` },
            { accountId: revenueAccount.id, debit: 0, credit: totalNum, description: `Revenue - ${invoiceNumber}` },
          ],
        },
      },
    });

    // Update account balances
    // For DEBIT normal accounts (Assets, Expenses): Debit increases, Credit decreases
    // For CREDIT normal accounts (Liabilities, Revenue): Credit increases, Debit decreases
    // We store all balances as positive and track debit/credit semantically
    // AR is debit-normal: debit increases balance
    await prisma.account.update({
      where: { id: arAccount.id },
      data: { balance: { increment: totalNum } }, // Debit increases AR
    });
    // Revenue is credit-normal: credit increases balance (store as positive)
    await prisma.account.update({
      where: { id: revenueAccount.id },
      data: { balance: { increment: totalNum } }, // Credit increases Revenue
    });
  } else if (type === 'PAYABLE' && apAccount && cogsAccount) {
    const entryNumber = await generateJournalEntryNumber();
    await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(issueDate),
        description: `Bill ${invoiceNumber} - Vendor expense`,
        createdById: req.user!.id,
        status: 'APPROVED',
        approvedAt: new Date(),
        lines: {
          create: [
            { accountId: cogsAccount.id, debit: totalNum, credit: 0, description: `Expense - ${invoiceNumber}` },
            { accountId: apAccount.id, debit: 0, credit: totalNum, description: `AP - ${invoiceNumber}` },
          ],
        },
      },
    });

    // Update account balances
    // COGS/Expense is debit-normal: debit increases balance
    await prisma.account.update({
      where: { id: cogsAccount.id },
      data: { balance: { increment: totalNum } }, // Debit increases Expense
    });
    // AP is credit-normal: credit increases balance (store as positive)
    await prisma.account.update({
      where: { id: apAccount.id },
      data: { balance: { increment: totalNum } }, // Credit increases AP (Liability)
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: { invoiceNumber, type, total: total.toString() },
    },
  });

  res.status(201).json({
    success: true,
    data: invoice,
  });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private/Finance
export const updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, dueDate } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === 'PAID') {
    throw new AppError('Cannot update a paid invoice', 400);
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: {
      status: status || invoice.status,
      dueDate: dueDate ? new Date(dueDate) : invoice.dueDate,
    },
    include: { items: true },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: updatedInvoice,
  });
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
export const deleteInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { payments: true },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.payments.length > 0) {
    throw new AppError('Cannot delete invoice with payments', 400);
  }

  await prisma.invoice.delete({
    where: { id: req.params.id },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Invoice',
      entityId: invoice.id,
    },
  });

  res.json({
    success: true,
    message: 'Invoice deleted successfully',
  });
});

// @desc    Record payment for invoice
// @route   POST /api/invoices/:id/payments
// @access  Private/Finance
export const recordPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, method, reference, notes } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { payments: true },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === 'PAID') {
    throw new AppError('Invoice is already fully paid', 400);
  }

  const paymentAmount = new Decimal(amount);
  const totalPaid = invoice.payments.reduce(
    (sum: Decimal, p: { amount: Decimal }) => sum.plus(p.amount),
    new Decimal(0)
  );
  const remaining = new Decimal(invoice.total).minus(totalPaid);

  if (paymentAmount.greaterThan(remaining)) {
    throw new AppError(`Payment amount exceeds remaining balance of ${remaining}`, 400);
  }

  // Generate payment number
  const paymentCount = await prisma.payment.count();
  const year = new Date().getFullYear();
  const paymentNumber = `PAY-${year}-${String(paymentCount + 1).padStart(5, '0')}`;

  // Create the payment record
  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      invoiceId: invoice.id,
      amount: paymentAmount,
      paymentMethod: method || 'BANK_TRANSFER',
      reference,
      paymentDate: new Date(),
    },
  });

  // Check if invoice is fully paid
  const newTotalPaid = totalPaid.plus(paymentAmount);
  const isFullyPaid = newTotalPaid.greaterThanOrEqualTo(invoice.total);

  // Update invoice status (PARTIAL or PAID per schema)
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: isFullyPaid ? 'PAID' : 'PARTIAL',
    },
  });

  // Create journal entry for payment
  // For RECEIVABLE: Debit Cash, Credit Accounts Receivable
  // For PAYABLE: Debit Accounts Payable, Credit Cash
  const cashAccount = await prisma.account.findUnique({ where: { code: '1000' } });
  const arAccount = await prisma.account.findUnique({ where: { code: '1100' } });
  const apAccount = await prisma.account.findUnique({ where: { code: '2000' } });

  if (cashAccount && (arAccount || apAccount)) {
    const entryNumber = await generateJournalEntryNumber();
    const paymentAmountNum = Number(paymentAmount);

    let lines;
    if (invoice.type === 'RECEIVABLE' && arAccount) {
      // Customer payment received
      lines = [
        { accountId: cashAccount.id, debit: paymentAmountNum, credit: 0, description: `Payment received - ${invoice.invoiceNumber}` },
        { accountId: arAccount.id, debit: 0, credit: paymentAmountNum, description: `AR reduction - ${invoice.invoiceNumber}` },
      ];
    } else if (apAccount) {
      // Vendor payment made
      lines = [
        { accountId: apAccount.id, debit: paymentAmountNum, credit: 0, description: `AP reduction - ${invoice.invoiceNumber}` },
        { accountId: cashAccount.id, debit: 0, credit: paymentAmountNum, description: `Payment made - ${invoice.invoiceNumber}` },
      ];
    }

    if (lines) {
      const journalEntry = await prisma.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(),
          description: `Payment ${invoice.type === 'RECEIVABLE' ? 'received' : 'made'} for ${invoice.invoiceNumber}`,
          createdById: req.user!.id,
          status: 'APPROVED',
          approvedAt: new Date(),
          lines: { create: lines },
        },
      });

      // Update account balances based on account type
      // For customer payment (RECEIVABLE): Cash ↑, AR ↓
      // For vendor payment (PAYABLE): AP ↓, Cash ↓
      if (invoice.type === 'RECEIVABLE' && arAccount) {
        // Cash (Asset): Debit increases
        await prisma.account.update({
          where: { id: cashAccount.id },
          data: { balance: { increment: paymentAmountNum } },
        });
        // AR (Asset): Credit decreases
        await prisma.account.update({
          where: { id: arAccount.id },
          data: { balance: { decrement: paymentAmountNum } },
        });
      } else if (apAccount) {
        // AP (Liability): Debit decreases
        await prisma.account.update({
          where: { id: apAccount.id },
          data: { balance: { decrement: paymentAmountNum } },
        });
        // Cash (Asset): Credit decreases
        await prisma.account.update({
          where: { id: cashAccount.id },
          data: { balance: { decrement: paymentAmountNum } },
        });
      }

      // Audit log for journal entry
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          entity: 'JournalEntry',
          entityId: journalEntry.id,
          details: { type: 'PAYMENT', invoiceId: invoice.id, amount: paymentAmountNum },
        },
      });
    }
  }

  // Audit log for payment
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      details: { invoiceId: invoice.id, amount: Number(paymentAmount), method },
    },
  });

  res.status(201).json({
    success: true,
    data: payment,
    message: isFullyPaid ? 'Invoice fully paid' : 'Payment recorded',
  });
});

// @desc    Get payments for invoice
// @route   GET /api/invoices/:id/payments
// @access  Private
export const getInvoicePayments = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const totalPaid = invoice.payments.reduce((sum: Decimal, p: { amount: Decimal }) => sum.plus(p.amount), new Decimal(0));
  const remaining = new Decimal(invoice.total).minus(totalPaid);

  res.json({
    success: true,
    data: {
      payments: invoice.payments,
      summary: {
        total: Number(invoice.total),
        paid: Number(totalPaid),
        remaining: Number(remaining),
      },
    },
  });
});
