import { Router } from 'express';
import {
  getExchangeRates,
  addExchangeRate,
  convertCurrency,
} from '../controllers/exchangeRate.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.route('/')
  .get(getExchangeRates)
  .post(authorize('Admin', 'Finance Manager'), addExchangeRate);

router.get('/convert', convertCurrency);

export default router;
