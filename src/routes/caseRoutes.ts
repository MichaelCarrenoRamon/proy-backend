import { Router } from 'express';
import { CaseController } from '../controllers/caseController';

const router = Router();

router.get('/cases', CaseController.getAll);
router.get('/cases/:cedula', CaseController.getById);
router.get('/cases/:cedula/ficha', CaseController.getFichaSocioeconomica);
router.post('/cases', CaseController.create);
router.post('/cases/complete', CaseController.createComplete);

// ✅ IMPORTANTE: Rutas específicas PRIMERO (de más específicas a más generales)
router.put('/cases/:cedulaVieja/migrate/:cedulaNueva', CaseController.migrateCedula);
router.put('/cases/:cedula/complete', CaseController.updateComplete);
router.put('/cases/:cedula', CaseController.update);

router.delete('/cases/:cedula', CaseController.delete);
router.post('/encuestas', CaseController.saveEncuesta);
router.get('/encuestas/stats', CaseController.getEncuestasStats);

export default router;