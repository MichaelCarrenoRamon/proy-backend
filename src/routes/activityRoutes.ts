import { Router } from 'express';
import { ActivityController } from '../controllers/activityController';

const router = Router();

router.get('/activities', ActivityController.getAll);
router.post('/activities', ActivityController.create);
router.put('/activities/:id', ActivityController.update);
router.delete('/activities/:id', ActivityController.delete);
router.patch('/activities/:id/toggle', ActivityController.toggleComplete);

export default router;