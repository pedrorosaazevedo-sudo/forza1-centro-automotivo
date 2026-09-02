import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { getDashboardData } from '../controllers/dashboardController';
import {
  createAtendimento,
  getAtendimentos,
  getAtendimentoById,
  updateAtendimento,
  deleteAtendimento,
  downloadPDF
} from '../controllers/atendimentoController';
import {
  getMecanicos,
  createMecanico,
  updateMecanico,
  deleteMecanico
} from '../controllers/mecanicoController';
import {
  getDespesas,
  createDespesa,
  updateDespesa,
  deleteDespesa
} from '../controllers/despesaController';
import {
  getTrafegoSemanal,
  createOrUpdateTrafego,
  deleteTrafego
} from '../controllers/trafegoController';
import {
  subscribePush,
  getVapidPublicKey,
  triggerScheduledReminder
} from '../controllers/pushController';
import {
  getEmpresaConfig,
  updateEmpresaConfig,
  getConfiguracaoFiscal,
  updateConfiguracaoFiscal
} from '../controllers/empresaController';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public Auth & Push Routes
router.post('/auth/login', login);
router.get('/push/vapid-key', getVapidPublicKey);

// Protected Routes (Authenticate required)
router.use(authenticate);

// Profile
router.get('/auth/me', getMe);

// Dashboard
router.get('/dashboard', getDashboardData);

// Empresa & Configurações Fiscais
router.get('/empresa', getEmpresaConfig);
router.put('/empresa', requireAdmin, updateEmpresaConfig);

router.get('/fiscal', getConfiguracaoFiscal);
router.put('/fiscal', requireAdmin, updateConfiguracaoFiscal);

// Atendimentos
router.get('/atendimentos', getAtendimentos);
router.post('/atendimentos', createAtendimento);
router.get('/atendimentos/:id', getAtendimentoById);
router.put('/atendimentos/:id', updateAtendimento);
router.delete('/atendimentos/:id', deleteAtendimento);
router.get('/atendimentos/:id/pdf', downloadPDF);

// Mecânicos
router.get('/mecanicos', getMecanicos);
router.post('/mecanicos', createMecanico);
router.put('/mecanicos/:id', updateMecanico);
router.delete('/mecanicos/:id', requireAdmin, deleteMecanico);

// Despesas Fixas
router.get('/despesas', getDespesas);
router.post('/despesas', createDespesa);
router.put('/despesas/:id', updateDespesa);
router.delete('/despesas/:id', requireAdmin, deleteDespesa);

// Tráfego Semanal (Anúncios)
router.get('/trafego', getTrafegoSemanal);
router.post('/trafego', createOrUpdateTrafego);
router.delete('/trafego/:id', requireAdmin, deleteTrafego);

// Push Notifications
router.post('/push/subscribe', subscribePush);
router.post('/push/send-scheduled', triggerScheduledReminder);

export default router;
