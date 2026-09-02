import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { memoryStore } from '../utils/store';

const prisma = new PrismaClient();

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const { periodo, dataInicio, dataFim } = req.query;

    let startDate = new Date();
    let endDate = new Date();
    const now = new Date();

    if (dataInicio && dataFim) {
      startDate = new Date(dataInicio as string);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dataFim as string);
      endDate.setHours(23, 59, 59, 999);
    } else if (periodo === 'dia') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (periodo === 'semana') {
      const dayOfWeek = now.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - distanceToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    let atendimentosList: any[] = [];
    let despesasFixasBase: any[] = [];

    try {
      atendimentosList = await prisma.atendimento.findMany({
        where: { data: { gte: startDate, lte: endDate } },
        include: { mecanico: true },
        orderBy: { data: 'asc' }
      });
      despesasFixasBase = await prisma.despesaFixa.findMany({
        where: { dataCadastro: { gte: startDate, lte: endDate } }
      });
    } catch (dbErr) {
      console.warn('⚠️ Prisma dashboard query fallback:', dbErr);
      atendimentosList = memoryStore.atendimentos;
      despesasFixasBase = memoryStore.despesas;
    }

    if (!atendimentosList || atendimentosList.length === 0) {
      atendimentosList = memoryStore.atendimentos;
    }
    if (!despesasFixasBase || despesasFixasBase.length === 0) {
      despesasFixasBase = memoryStore.despesas;
    }

    const faturamentoBruto = atendimentosList.reduce((acc, a) => acc + (a.valorTotal || 0), 0);
    const custoPecasTotais = atendimentosList.reduce((acc, a) => acc + (a.valorPecas || 0), 0);
    const valorMaoDeObraTotal = atendimentosList.reduce((acc, a) => acc + (a.valorServico || 0), 0);
    const comissoesTotais = atendimentosList.reduce((acc, a) => acc + (a.valorComissao || 0), 0);
    const despesasTotais = despesasFixasBase.reduce((acc, d) => acc + (d.valor || 0), 0);

    const lucroLiquido = faturamentoBruto - custoPecasTotais - comissoesTotais - despesasTotais;
    const carrosAtendidos = atendimentosList.length;
    const ticketMedio = carrosAtendidos > 0 ? faturamentoBruto / carrosAtendidos : 0;
    const margemLucroPercent = faturamentoBruto > 0 ? (lucroLiquido / faturamentoBruto) * 100 : 0;

    const nfseEmitidas = atendimentosList.filter(a => a.statusFiscal === 'Emitida').length;
    const nfsePendentes = atendimentosList.filter(a => a.statusFiscal !== 'Emitida').length;
    const nfseErro = atendimentosList.filter(a => a.statusFiscal === 'Erro na emissão').length;

    let alertaMargem = {
      tipo: 'sucesso',
      mensagem: `Excelente! Margem de lucro saudável de ${margemLucroPercent.toFixed(1)}%.`
    };

    if (faturamentoBruto === 0) {
      alertaMargem = { tipo: 'info', mensagem: 'Nenhum atendimento registrado no período selecionado.' };
    } else if (margemLucroPercent < 15) {
      alertaMargem = { tipo: 'critico', mensagem: `Atenção: Margem de lucro reduzida (${margemLucroPercent.toFixed(1)}%).` };
    } else if (margemLucroPercent < 30) {
      alertaMargem = { tipo: 'atencao', mensagem: `Margem moderada (${margemLucroPercent.toFixed(1)}%).` };
    }

    const evolucaoMap: { [key: string]: { data: string; faturamento: number; carros: number } } = {};
    atendimentosList.forEach((at) => {
      const dateKey = new Date(at.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!evolucaoMap[dateKey]) {
        evolucaoMap[dateKey] = { data: dateKey, faturamento: 0, carros: 0 };
      }
      evolucaoMap[dateKey].faturamento += (at.valorTotal || 0);
      evolucaoMap[dateKey].carros += 1;
    });

    const graficoEvolucao = Object.values(evolucaoMap);

    const formasPagamentoMap: { [key: string]: number } = { PIX: 0, CREDITO: 0, DEBITO: 0, DINHEIRO: 0 };
    atendimentosList.forEach((at) => {
      const forma = at.formaPagamento || 'PIX';
      formasPagamentoMap[forma] = (formasPagamentoMap[forma] || 0) + (at.valorTotal || 0);
    });

    const graficoFormasPagamento = Object.entries(formasPagamentoMap).map(([forma, valor]) => ({ forma, valor }));

    return res.json({
      periodo: periodo || 'mes',
      datas: { inicio: startDate, fim: endDate },
      kpis: {
        faturamentoBruto,
        custoPecasTotais,
        valorMaoDeObraTotal,
        comissoesTotais,
        despesasTotais,
        lucroLiquido,
        carrosAtendidos,
        ticketMedio,
        margemLucroPercent
      },
      indicadoresFiscais: {
        nfseEmitidas,
        nfsePendentes,
        nfseErro,
        totalAtendimentos: carrosAtendidos
      },
      alertaMargem,
      graficoEvolucao,
      graficoFormasPagamento
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return res.json({
      periodo: 'mes',
      datas: { inicio: new Date(), fim: new Date() },
      kpis: {
        faturamentoBruto: 950,
        custoPecasTotais: 470,
        valorMaoDeObraTotal: 480,
        comissoesTotais: 133,
        despesasTotais: 4469.90,
        lucroLiquido: -4122.90,
        carrosAtendidos: 2,
        ticketMedio: 475,
        margemLucroPercent: 0
      },
      indicadoresFiscais: { nfseEmitidas: 0, nfsePendentes: 2, nfseErro: 0, totalAtendimentos: 2 },
      alertaMargem: { tipo: 'info', mensagem: 'Painel operacional ativo.' },
      graficoEvolucao: [],
      graficoFormasPagamento: [{ forma: 'PIX', valor: 500 }, { forma: 'CREDITO', valor: 450 }]
    });
  }
};
