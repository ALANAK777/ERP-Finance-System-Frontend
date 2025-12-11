import { Router } from 'express';
import {
  getKPIs,
  getAlerts,
  getCashFlowSummary,
  getReceivablesPayables,
} from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/kpis', getKPIs);
router.get('/alerts', getAlerts);
router.get('/cash-flow', getCashFlowSummary);
router.get('/receivables-payables', getReceivablesPayables);

export default router;
