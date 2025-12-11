import { Router } from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/vendor.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createVendorSchema } from '../validators/invoice.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getVendors)
  .post(authorize('Admin', 'Finance Manager'), validate(createVendorSchema), createVendor);

router.route('/:id')
  .get(getVendorById)
  .put(authorize('Admin', 'Finance Manager'), updateVendor)
  .delete(authorize('Admin'), deleteVendor);

export default router;
