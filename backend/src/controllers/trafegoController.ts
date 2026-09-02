import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { memoryStore } from '../utils/store';

const prisma = new PrismaClient();

export const getTrafegoSemanal = async (req: AuthRequest, res: Response) => {
  try {
    let trafegoList: any[] = [];
    let atendimentosList: any[] = [];

    try {
      trafegoList = await prisma.trafegoSemanal.findMany({
        orderBy: { semanaReferencia: 'desc' }
      });
      atendimentosList = await prisma.atendimento.findMany();
    } catch (dbErr) {
      console.warn('⚠️ Prisma getTrafegoSemanal fallback:', dbErr);
      trafegoList = memoryStore.trafego;
      atendimentosList = memoryStore.atendimentos;
    }

    if (!trafegoList || trafegoList.length === 0) {
      trafegoList = memoryStore.trafego;
    }
    if (!atendimentosList || atendimentosList.length === 0) {
      atendimentosList = memoryStore.atendimentos;
    }

    const resultado = trafegoList.map((t) => {
      const faturamentoTotal = atendimentosList.reduce((sum, a) => sum + (a.valorTotal || 0), 0);
      const roi = t.valorInvestido > 0 ? (faturamentoTotal / t.valorInvestido) : 0;
      const custoPorMensagem = t.mensagensRecebidas > 0 ? t.valorInvestido / t.mensagensRecebidas : 0;

      return {
        id: t.id,
        semanaReferencia: t.semanaReferencia,
        mensagensRecebidas: t.mensagensRecebidas,
        valorInvestido: t.valorInvestido,
        custoPorMensagem,
        faturamentoGerado: faturamentoTotal,
        roi
      };
    });

    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar dados de tráfego:', error);
    return res.json(memoryStore.trafego);
  }
};

export const createTrafegoSemanal = async (req: AuthRequest, res: Response) => {
  try {
    const { mensagensRecebidas, valorInvestido, semanaReferencia } = req.body;

    const msgsNum = parseInt(mensagensRecebidas, 10) || 0;
    const invNum = parseFloat(valorInvestido) || 0;
    const dataSemana = semanaReferencia ? new Date(semanaReferencia) : new Date();

    try {
      const novoRegistroDb = await prisma.trafegoSemanal.create({
        data: {
          semanaReferencia: dataSemana,
          mensagensRecebidas: msgsNum,
          valorInvestido: invNum
        }
      });
      memoryStore.addTrafego(msgsNum, invNum, dataSemana);
      return res.status(201).json(novoRegistroDb);
    } catch (dbErr) {
      console.warn('⚠️ Prisma createTrafegoSemanal fallback:', dbErr);
    }

    const novoRegistro = memoryStore.addTrafego(msgsNum, invNum, dataSemana);
    return res.status(201).json(novoRegistro);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar semana de tráfego' });
  }
};

export const createOrUpdateTrafego = createTrafegoSemanal;

export const deleteTrafego = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    try {
      await prisma.trafegoSemanal.delete({ where: { id } });
    } catch (dbErr) {}
    const idx = memoryStore.trafego.findIndex(t => t.id === id);
    if (idx !== -1) memoryStore.trafego.splice(idx, 1);
    return res.json({ message: 'Registro de tráfego excluído' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir tráfego' });
  }
};
