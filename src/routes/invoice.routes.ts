import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  getInvoicePayments,
} from '../controllers/invoice.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createInvoiceSchema } from '../validators/invoice.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(authorize('Admin', 'Finance Manager'), validate(createInvoiceSchema), createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(authorize('Admin', 'Finance Manager'), updateInvoice)
  .delete(authorize('Admin'), deleteInvoice);

// Payment routes
router.route('/:id/payments')
  .get(getInvoicePayments)
  .post(authorize('Admin', 'Finance Manager'), recordPayment);

export default router;
