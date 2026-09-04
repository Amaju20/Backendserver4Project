import { Router } from 'express';
import { listMyRsvps, toggleRsvp } from '../controllers/rsvp.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, listMyRsvps);
router.post('/:sessionId', protect, toggleRsvp);

export default router;
