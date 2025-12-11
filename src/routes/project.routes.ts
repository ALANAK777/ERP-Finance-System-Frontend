import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addProgress,
  deleteProject,
} from '../controllers/project.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema, addProgressSchema } from '../validators/project.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(validate(createProjectSchema), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(validate(updateProjectSchema), updateProject)
  .delete(authorize('Admin'), deleteProject);

router.post('/:id/progress', validate(addProgressSchema), addProgress);

export default router;
