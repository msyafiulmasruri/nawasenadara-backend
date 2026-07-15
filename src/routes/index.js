import { Router } from 'express';
import authenticationRoutes from '../services/authentications/routes/index.js';

const router = Router();

router.use('/auth', authenticationRoutes);

export default router;
