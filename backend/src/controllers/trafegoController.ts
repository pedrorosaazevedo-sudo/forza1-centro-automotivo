import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// Helper to get start and end of week from a date
const getWeekRange = (refDate: Date) => {
  const d = new Date(refDate);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
};

export const getTrafegoSemanal = async (req: AuthRequest, res: Response) => {
  try {
    const registros = await prisma.trafegoSemanal.findMany({
      orderBy: { semanaReferencia: 'desc' }
    });

    const resultado = await Promise.all(
      registros.map(async (reg) => {
        const { monday, sunday } = getWeekRange(reg.semanaReferencia);

        // Contagem automática de atendimentos na semana
        const atendimentosSemana = await prisma.atendimento.findMany({
          where: {
            data: {
              gte: monday,
              lte: sunday
            }
          }
        });

        const carrosAtendidos = atendimentosSemana.length;
        const faturamentoSemana = atendimentosSemana.reduce((acc, a) => acc + a.valorTotal, 0);

        const custoPorMensagem = reg.mensagensRecebidas > 0 ? reg.valorInvestido / reg.mensagensRecebidas : 0;
        const custoPorCarro = carrosAtendidos > 0 ? reg.valorInvestido / carrosAtendidos : 0;
        const roi = reg.valorInvestido > 0 ? faturamentoSemana / reg.valorInvestido : 0;

        return {
          id: reg.id,
          semanaReferencia: reg.semanaReferencia,
          semanaInicio: monday,
          semanaFim: sunday,
          mensagensRecebidas: reg.mensagensRecebidas,
          valorInvestido: reg.valorInvestido,
          carrosAtendidos, // calculado automaticamente
          faturamentoSemana,
          custoPorMensagem,
          custoPorCarro,
          roi
        };
      })
    );

    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar tráfego semanal:', error);
    return res.status(500).json({ error: 'Erro ao buscar métricas de tráfego' });
  }
};

export const createOrUpdateTrafego = async (req: AuthRequest, res: Response) => {
  try {
    const { semanaReferencia, mensagensRecebidas, valorInvestido } = req.body;

    if (!semanaReferencia || mensagensRecebidas === undefined || valorInvestido === undefined) {
      return res.status(400).json({ error: 'Preencha a data da semana, mensagens recebidas e valor investido' });
    }

    const refDate = new Date(semanaReferencia);
    const { monday } = getWeekRange(refDate);

    const msgs = Number(mensagensRecebidas) || 0;
    const inv = Number(valorInvestido) || 0;

    // Procura se já existe registro para a mesma semana (mesma segunda-feira)
    const existente = await prisma.trafegoSemanal.findFirst({
      where: {
        semanaReferencia: monday
      }
    });

    let registro;
    if (existente) {
      registro = await prisma.trafegoSemanal.update({
        where: { id: existente.id },
        data: {
          mensagensRecebidas: msgs,
          valorInvestido: inv
        }
      });
    } else {
      registro = await prisma.trafegoSemanal.create({
        data: {
          semanaReferencia: monday,
          mensagensRecebidas: msgs,
          valorInvestido: inv
        }
      });
    }

    return res.status(201).json(registro);
  } catch (error) {
    console.error('Erro ao salvar tráfego:', error);
    return res.status(500).json({ error: 'Erro ao registrar tráfego semanal' });
  }
};

export const deleteTrafego = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.trafegoSemanal.delete({ where: { id } });
    return res.json({ message: 'Registro de tráfego excluído' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir registro de tráfego' });
  }
};
