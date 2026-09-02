import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

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
      // mes (padrão)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Atendimentos no período
    const atendimentos = await prisma.atendimento.findMany({
      where: {
        data: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        mecanico: true
      },
      orderBy: { data: 'asc' }
    });

    // Despesas fixas do período
    const despesas = await prisma.despesaFixa.findMany({
      where: {
        dataCadastro: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalDespesasFixasBase = await prisma.despesaFixa.aggregate({
      _sum: { valor: true }
    });

    const despesasPeriodoDireto = despesas.reduce((acc, d) => acc + d.valor, 0);
    const despesasTotais = despesasPeriodoDireto > 0 ? despesasPeriodoDireto : (totalDespesasFixasBase._sum.valor || 0);

    // Faturamento e Custos
    const faturamentoBruto = atendimentos.reduce((acc, a) => acc + a.valorTotal, 0);
    const custoPecasTotais = atendimentos.reduce((acc, a) => acc + a.valorPecas, 0);
    const valorMaoDeObraTotal = atendimentos.reduce((acc, a) => acc + a.valorServico, 0);
    const comissoesTotais = atendimentos.reduce((acc, a) => acc + a.valorComissao, 0);

    // Lucro Líquido = Faturamento Bruto - Custos de Peças - Comissões - Despesas Operacionais
    const lucroLiquido = faturamentoBruto - custoPecasTotais - comissoesTotais - despesasTotais;
    const carrosAtendidos = atendimentos.length;
    const ticketMedio = carrosAtendidos > 0 ? faturamentoBruto / carrosAtendidos : 0;
    const margemLucroPercent = faturamentoBruto > 0 ? (lucroLiquido / faturamentoBruto) * 100 : 0;

    // FASE 7: Indicadores Fiscais
    const nfseEmitidas = atendimentos.filter(a => a.statusFiscal === 'Emitida').length;
    const nfsePendentes = atendimentos.filter(a => a.statusFiscal !== 'Emitida').length;
    const nfseErro = atendimentos.filter(a => a.statusFiscal === 'Erro na emissão').length;

    // Alertas de Margem
    let alertaMargem = {
      tipo: 'normal',
      mensagem: 'Margem de lucro dentro do esperado.'
    };

    if (faturamentoBruto === 0) {
      alertaMargem = { tipo: 'info', mensagem: 'Nenhum atendimento registrado no período selecionado.' };
    } else if (margemLucroPercent < 15) {
      alertaMargem = { tipo: 'critico', mensagem: `Atenção: Margem de lucro reduzida (${margemLucroPercent.toFixed(1)}%). Verifique custos de peças e despesas.` };
    } else if (margemLucroPercent < 30) {
      alertaMargem = { tipo: 'atencao', mensagem: `Margem moderada (${margemLucroPercent.toFixed(1)}%). Ideal buscar acima de 30%.` };
    } else {
      alertaMargem = { tipo: 'sucesso', mensagem: `Excelente! Margem de lucro saudável de ${margemLucroPercent.toFixed(1)}%.` };
    }

    // Gráfico de evolução por data
    const evolucaoMap: { [key: string]: { data: string; faturamento: number; carros: number } } = {};

    atendimentos.forEach((at) => {
      const dateKey = new Date(at.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!evolucaoMap[dateKey]) {
        evolucaoMap[dateKey] = { data: dateKey, faturamento: 0, carros: 0 };
      }
      evolucaoMap[dateKey].faturamento += at.valorTotal;
      evolucaoMap[dateKey].carros += 1;
    });

    const graficoEvolucao = Object.values(evolucaoMap);

    // Gráfico de Formas de Pagamento
    const formasPagamentoMap: { [key: string]: number } = {
      PIX: 0,
      CREDITO: 0,
      DEBITO: 0,
      DINHEIRO: 0
    };

    atendimentos.forEach((at) => {
      if (formasPagamentoMap[at.formaPagamento] !== undefined) {
        formasPagamentoMap[at.formaPagamento] += at.valorTotal;
      } else {
        formasPagamentoMap[at.formaPagamento] = at.valorTotal;
      }
    });

    const graficoFormasPagamento = Object.entries(formasPagamentoMap).map(([forma, valor]) => ({
      forma,
      valor
    }));

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
    return res.status(500).json({ error: 'Erro ao gerar indicadores do dashboard' });
  }
};
