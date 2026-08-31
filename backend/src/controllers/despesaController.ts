import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getDespesas = async (req: AuthRequest, res: Response) => {
  try {
    const despesas = await prisma.despesaFixa.findMany({
      orderBy: { dataCadastro: 'desc' }
    });

    const totalValor = despesas.reduce((acc, d) => acc + d.valor, 0);

    return res.json({
      despesas,
      totalValor
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar despesas fixas' });
  }
};

export const createDespesa = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, categoria, valor } = req.body;
    if (!nome || valor === undefined) {
      return res.status(400).json({ error: 'Nome e valor da despesa são obrigatórios' });
    }

    const despesa = await prisma.despesaFixa.create({
      data: {
        nome,
        categoria: categoria || 'Geral',
        valor: Number(valor)
      }
    });

    return res.status(201).json(despesa);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar despesa' });
  }
};

export const updateDespesa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, categoria, valor } = req.body;

    const despesa = await prisma.despesaFixa.update({
      where: { id },
      data: {
        nome,
        categoria,
        valor: Number(valor)
      }
    });

    return res.json(despesa);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
};

export const deleteDespesa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.despesaFixa.delete({ where: { id } });
    return res.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir despesa' });
  }
};
