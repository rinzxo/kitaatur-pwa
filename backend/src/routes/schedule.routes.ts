import { Router } from 'express';
import { requireOrgRole } from '../middleware/role.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule } from '../controllers/schedule.controller';

const router = Router();

router.use(requireAuth);

router.get('/:orgIdOrSlug', requireOrgRole(['head', 'sekretaris', 'member']), getSchedules);
router.post('/:orgIdOrSlug', requireOrgRole(['head', 'sekretaris']), createSchedule);
router.delete('/:orgIdOrSlug/:scheduleId', requireOrgRole(['head', 'sekretaris']), deleteSchedule);
router.patch('/:orgIdOrSlug/:scheduleId/toggle', requireOrgRole(['head', 'sekretaris']), toggleSchedule);

export default router;
