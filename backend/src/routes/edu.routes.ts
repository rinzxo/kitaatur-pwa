import { Router } from 'express';
import { getEduSchools, verifySchoolPin, getStudentStats } from '../controllers/edu.controller';

const router = Router();

// Public routes for KitaAtur Edu
router.get('/schools', getEduSchools);
router.post('/schools/:orgId/verify', verifySchoolPin);
router.post('/schools/:orgId/student', getStudentStats);

export default router;
