import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { memoryStore } from '../utils/store';

const prisma = new PrismaClient();

export const getMecanicos = async (req: AuthRequest, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;

    let dateFilter = {};
    if (dataInicio && dataFim) {
      dateFilter = {
        data: {
          gte: new Date(`${dataInicio}T00:00:00.000Z`),
          lte: new Date(`${dataFim}T23:59:59.999Z`)
        }
      };
    }

    try {
      const mecanicosDb = await prisma.mecanico.findMany({
        include: {
          atendimentos: {
            where: dateFilter,
            select: { id: true, valorComissao: true, valorTotal: true }
          }
        },
        orderBy: { nome: 'asc' }
      });

      if (mecanicosDb && mecanicosDb.length > 0) {
        const resultado = mecanicosDb.map((m) => {
          const totalComissoes = m.atendimentos.reduce((acc, a) => acc + a.valorComissao, 0);
          const totalFaturamento = m.atendimentos.reduce((acc, a) => acc + a.valorTotal, 0);
          const totalAtendimentos = m.atendimentos.length;

          return {
            id: m.id,
            nome: m.nome,
            especialidade: m.especialidade,
            createdAt: m.createdAt,
            totalComissoes,
            totalFaturamento,
            totalAtendimentos
          };
        });

        return res.json(resultado);
      }
    } catch (dbErr) {
      console.warn('⚠️ Prisma mecanicos query fallback:', dbErr);
    }

    // Fallback Resiliente via memoryStore
    const resultadoFallback = memoryStore.mecanicos.map((m) => {
      const atendimentosMec = memoryStore.atendimentos.filter(a => a.mecanicoId === m.id);
      const totalComissoes = atendimentosMec.reduce((acc, a) => acc + a.valorComissao, 0);
      const totalFaturamento = atendimentosMec.reduce((acc, a) => acc + a.valorTotal, 0);

      return {
        id: m.id,
        nome: m.nome,
        especialidade: m.especialidade,
        createdAt: m.createdAt,
        totalComissoes,
        totalFaturamento,
        totalAtendimentos: atendimentosMec.length
      };
    });

    return res.json(resultadoFallback);
  } catch (error) {
    console.error('Erro ao listar mecânicos:', error);
    return res.json(memoryStore.mecanicos);
  }
};

export const createMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, especialidade } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome do mecânico é obrigatório' });
    }

    try {
      const mecanicoDb = await prisma.mecanico.create({
        data: { nome, especialidade: especialidade || 'Geral' }
      });

      memoryStore.addMecanico(mecanicoDb.nome, mecanicoDb.especialidade);
      return res.status(201).json(mecanicoDb);
    } catch (dbErr) {
      console.warn('⚠️ Prisma createMecanico fallback:', dbErr);
    }

    // Fallback Resiliente
    const novoMecanico = memoryStore.addMecanico(nome, especialidade);
    return res.status(201).json(novoMecanico);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar mecânico' });
  }
};

export const updateMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, especialidade } = req.body;

    try {
      const mecanicoDb = await prisma.mecanico.update({
        where: { id },
        data: { nome, especialidade }
      });
      memoryStore.updateMecanico(id, nome, especialidade);
      return res.json(mecanicoDb);
    } catch (dbErr) {
      console.warn('⚠️ Prisma updateMecanico fallback:', dbErr);
    }

    const updated = memoryStore.updateMecanico(id, nome, especialidade);
    return res.json(updated || { id, nome, especialidade });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar mecânico' });
  }
};

export const deleteMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    try {
      await prisma.mecanico.delete({ where: { id } });
    } catch (dbErr) {
      console.warn('⚠️ Prisma deleteMecanico fallback:', dbErr);
    }
    memoryStore.deleteMecanico(id);
    return res.json({ message: 'Mecânico excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir mecânico' });
  }
};
