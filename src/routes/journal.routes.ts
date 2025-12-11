import { Router } from 'express';
import {
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  approveJournalEntry,
  rejectJournalEntry,
} from '../controllers/journal.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJournalEntrySchema } from '../validators/finance.validator';

const router = Router();

router.use(protect);

router.route('/')
  .get(getJournalEntries)
  .post(authorize('Admin', 'Finance Manager'), validate(createJournalEntrySchema), createJournalEntry);

router.route('/:id')
  .get(getJournalEntryById);

router.put('/:id/approve', authorize('Admin', 'Finance Manager'), approveJournalEntry);
router.put('/:id/reject', authorize('Admin', 'Finance Manager'), rejectJournalEntry);

export default router;
