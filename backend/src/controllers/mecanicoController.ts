import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

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

    const mecanicos = await prisma.mecanico.findMany({
      include: {
        atendimentos: {
          where: dateFilter,
          select: {
            id: true,
            valorComissao: true,
            valorTotal: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    });

    const resultado = mecanicos.map((m) => {
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
  } catch (error) {
    console.error('Erro ao listar mecânicos:', error);
    return res.status(500).json({ error: 'Erro ao listar mecânicos' });
  }
};

export const createMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, especialidade } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome do mecânico é obrigatório' });
    }

    const mecanico = await prisma.mecanico.create({
      data: {
        nome,
        especialidade: especialidade || 'Geral'
      }
    });

    return res.status(201).json(mecanico);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar mecânico' });
  }
};

export const updateMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, especialidade } = req.body;

    const mecanico = await prisma.mecanico.update({
      where: { id },
      data: { nome, especialidade }
    });

    return res.json(mecanico);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar mecânico' });
  }
};

export const deleteMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.mecanico.delete({ where: { id } });
    return res.json({ message: 'Mecânico excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir mecânico (verifique se há atendimentos associados)' });
  }
};
