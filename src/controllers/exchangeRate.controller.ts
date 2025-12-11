import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// @desc    Get all exchange rates
// @route   GET /api/exchange-rates
// @access  Private
export const getExchangeRates = asyncHandler(async (req: Request, res: Response) => {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: [{ fromCurrency: 'asc' }, { effectiveDate: 'desc' }],
  });

  // Get latest rate for each currency pair
  const latestRates: Record<string, typeof rates[0]> = {};
  rates.forEach((rate: typeof rates[0]) => {
    const key = `${rate.fromCurrency}-${rate.toCurrency}`;
    if (!latestRates[key]) {
      latestRates[key] = rate;
    }
  });

  res.json({
    success: true,
    data: Object.values(latestRates),
  });
});

// @desc    Add exchange rate
// @route   POST /api/exchange-rates
// @access  Private/Finance
export const addExchangeRate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fromCurrency, toCurrency, rate, effectiveDate } = req.body;

  const exchangeRate = await prisma.exchangeRate.create({
    data: {
      fromCurrency,
      toCurrency,
      rate,
      effectiveDate: new Date(effectiveDate),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'ExchangeRate',
      entityId: exchangeRate.id,
      details: { fromCurrency, toCurrency, rate },
    },
  });

  res.status(201).json({
    success: true,
    data: exchangeRate,
  });
});

// @desc    Convert currency
// @route   GET /api/exchange-rates/convert
// @access  Private
export const convertCurrency = asyncHandler(async (req: Request, res: Response) => {
  const { from, to, amount } = req.query;

  if (!from || !to || !amount) {
    throw new AppError('from, to, and amount are required', 400);
  }

  // Get latest rate
  const rate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: String(from),
      toCurrency: String(to),
      effectiveDate: { lte: new Date() },
    },
    orderBy: { effectiveDate: 'desc' },
  });

  if (!rate) {
    // Try inverse
    const inverseRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: String(to),
        toCurrency: String(from),
        effectiveDate: { lte: new Date() },
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!inverseRate) {
      throw new AppError(`Exchange rate not found for ${from} to ${to}`, 404);
    }

    const convertedAmount = new Decimal(Number(amount)).dividedBy(inverseRate.rate);
    res.json({
      success: true,
      data: {
        from,
        to,
        originalAmount: Number(amount),
        rate: Number(new Decimal(1).dividedBy(inverseRate.rate)),
        convertedAmount: Number(convertedAmount.toFixed(2)),
      },
    });
    return;
  }

  const convertedAmount = new Decimal(Number(amount)).times(rate.rate);

  res.json({
    success: true,
    data: {
      from,
      to,
      originalAmount: Number(amount),
      rate: Number(rate.rate),
      convertedAmount: Number(convertedAmount.toFixed(2)),
    },
  });
});
