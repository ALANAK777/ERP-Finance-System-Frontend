import { Router } from 'express';
import {
  getProjectRiskScore,
  getCashFlowForecast,
  getProjectHealth,
} from '../controllers/insights.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/risk-score/:projectId', getProjectRiskScore);
router.get('/cash-forecast', getCashFlowForecast);
router.get('/project-health', getProjectHealth);

export default router;
