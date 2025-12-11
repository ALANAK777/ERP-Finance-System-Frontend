import { Router } from 'express';
import {
  getPayments,
  getPaymentById,
  createPayment,
} from '../controllers/payment.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPaymentSchema } from '../validators/invoice.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(authorize('Admin', 'Finance Manager'), validate(createPaymentSchema), createPayment);

router.route('/:id')
  .get(getPaymentById);

export default router;
