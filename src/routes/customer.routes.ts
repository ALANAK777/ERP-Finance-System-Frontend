import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCustomerSchema } from '../validators/invoice.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(authorize('Admin', 'Finance Manager'), validate(createCustomerSchema), createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(authorize('Admin', 'Finance Manager'), updateCustomer)
  .delete(authorize('Admin'), deleteCustomer);

export default router;
