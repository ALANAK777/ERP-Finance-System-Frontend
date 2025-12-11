import { Router } from 'express';
import {
  getBalanceSheet,
  getProfitLoss,
  getCashFlowStatement,
} from '../controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/balance-sheet', getBalanceSheet);
router.get('/profit-loss', getProfitLoss);
router.get('/cash-flow', getCashFlowStatement);

export default router;
