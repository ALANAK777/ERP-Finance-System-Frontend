import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/account.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAccountSchema, updateAccountSchema } from '../validators/finance.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(authorize('Admin', 'Finance Manager'), validate(createAccountSchema), createAccount);

router.route('/:id')
  .get(getAccountById)
  .put(authorize('Admin', 'Finance Manager'), validate(updateAccountSchema), updateAccount)
  .delete(authorize('Admin'), deleteAccount);

export default router;
