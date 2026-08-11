import { Router } from 'express';
import { getEduSchools, verifySchoolPin, getStudentStats, submitStudentLeave, getMonitorData } from '../controllers/school.controller';

const router = Router();

// Public routes for KitaAtur Edu
router.get('/schools', getEduSchools);
router.post('/schools/:orgId/verify', verifySchoolPin);
router.post('/schools/:orgId/student', getStudentStats);
router.post('/schools/:orgId/student/leave', submitStudentLeave);
router.post('/schools/:orgId/monitor', getMonitorData);

export default router;
