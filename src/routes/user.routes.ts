import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getAuditLogs,
} from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateUserSchema } from '../validators/auth.validator';

const router = Router();

router.use(protect);

// Role management
router.route('/roles')
  .get(getRoles)
  .post(authorize('Admin'), createRole);

router.route('/roles/:id')
  .put(authorize('Admin'), updateRole)
  .delete(authorize('Admin'), deleteRole);

router.get('/permissions', authorize('Admin'), getPermissions);
router.get('/audit-logs', authorize('Admin'), getAuditLogs);

router.route('/')
  .get(authorize('Admin'), getUsers);

router.route('/:id')
  .get(authorize('Admin'), getUserById)
  .put(authorize('Admin'), validate(updateUserSchema), updateUser)
  .delete(authorize('Admin'), deleteUser);

export default router;
