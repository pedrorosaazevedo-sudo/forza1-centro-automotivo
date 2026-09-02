import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { memoryStore } from '../utils/store';

const prisma = new PrismaClient();

export const getDespesas = async (req: AuthRequest, res: Response) => {
  try {
    try {
      const despesasDb = await prisma.despesaFixa.findMany({
        orderBy: { dataCadastro: 'desc' }
      });

      if (despesasDb && despesasDb.length > 0) {
        const totalValor = despesasDb.reduce((sum, item) => sum + item.valor, 0);
        return res.json({ despesas: despesasDb, totalValor });
      }
    } catch (dbErr) {
      console.warn('⚠️ Prisma getDespesas fallback:', dbErr);
    }

    const totalValor = memoryStore.despesas.reduce((sum, item) => sum + item.valor, 0);
    return res.json({ despesas: memoryStore.despesas, totalValor });
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    const totalValor = memoryStore.despesas.reduce((sum, item) => sum + item.valor, 0);
    return res.json({ despesas: memoryStore.despesas, totalValor });
  }
};

export const createDespesa = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, valor, categoria } = req.body;

    if (!nome || valor === undefined || valor === null) {
      return res.status(400).json({ error: 'Nome e valor são obrigatórios' });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum < 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    try {
      const novaDespesaDb = await prisma.despesaFixa.create({
        data: {
          nome,
          valor: valorNum,
          categoria: categoria || 'Geral'
        }
      });
      memoryStore.addDespesa(novaDespesaDb.nome, novaDespesaDb.categoria, novaDespesaDb.valor);
      return res.status(201).json(novaDespesaDb);
    } catch (dbErr) {
      console.warn('⚠️ Prisma createDespesa fallback:', dbErr);
    }

    const novaDespesa = memoryStore.addDespesa(nome, categoria, valorNum);
    return res.status(201).json(novaDespesa);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar despesa' });
  }
};

export const updateDespesa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, valor, categoria } = req.body;

    try {
      const updatedDb = await prisma.despesaFixa.update({
        where: { id },
        data: {
          ...(nome && { nome }),
          ...(valor !== undefined && { valor: parseFloat(valor) }),
          ...(categoria && { categoria })
        }
      });
      memoryStore.updateDespesa(id, nome, categoria, parseFloat(valor));
      return res.json(updatedDb);
    } catch (dbErr) {
      console.warn('⚠️ Prisma updateDespesa fallback:', dbErr);
    }

    const updated = memoryStore.updateDespesa(id, nome, categoria, parseFloat(valor));
    return res.json(updated || { id, nome, categoria, valor });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
};

export const deleteDespesa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    try {
      await prisma.despesaFixa.delete({ where: { id } });
    } catch (dbErr) {
      console.warn('⚠️ Prisma deleteDespesa fallback:', dbErr);
    }
    memoryStore.deleteDespesa(id);
    return res.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir despesa' });
  }
};
