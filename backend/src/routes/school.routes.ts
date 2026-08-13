import { Router } from 'express';
import { getEduSchools, verifySchoolPin, getStudentStats, submitStudentLeave, getMonitorData, updateLeaveProof } from '../controllers/school.controller';

const router = Router();

// Public routes for KitaAtur Edu
router.get('/schools', getEduSchools);
router.post('/schools/:orgId/verify', verifySchoolPin);
router.post('/schools/:orgId/student', getStudentStats);
router.post('/schools/:orgId/student/leave', submitStudentLeave);
router.patch('/schools/:orgId/student/leave/proof', updateLeaveProof);
router.post('/schools/:orgId/monitor', getMonitorData);

export default router;
