export type Role = 'OPERACIONAL' | 'ADMIN';

export interface Usuario {
  id: string;
  email: string;
  papel: Role;
}

export interface Mecanico {
  id: string;
  nome: string;
  especialidade: string;
  totalComissoes?: number;
  totalFaturamento?: number;
  totalAtendimentos?: number;
}

export interface DespesaFixa {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  dataCadastro?: string;
}

export type FormaPagamento = 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO';

export interface Atendimento {
  id: string;
  data: string;
  nomeCliente: string;
  telefoneCliente?: string;
  veiculo?: string;
  mecanicoId: string;
  mecanico?: Mecanico;
  descricaoServico: string;
  valorPecas: number;
  valorServico: number;
  valorTotal: number;
  percentualComissao: number;
  valorComissao: number;
  formaPagamento: FormaPagamento;
}

export interface TrafegoSemanal {
  id: string;
  semanaReferencia: string;
  semanaInicio: string;
  semanaFim: string;
  mensagensRecebidas: number;
  valorInvestido: number;
  carrosAtendidos: number;
  faturamentoSemana: number;
  custoPorMensagem: number;
  custoPorCarro: number;
  roi: number;
}

export interface DashboardData {
  periodo: 'dia' | 'semana' | 'mes';
  datas: { inicio: string; fim: string };
  kpis: {
    faturamentoBruto: number;
    comissoesTotais: number;
    despesasTotais: number;
    lucroLiquido: number;
    carrosAtendidos: number;
    ticketMedio: number;
    margemLucroPercent: number;
  };
  alertaMargem: {
    tipo: 'critico' | 'atencao' | 'sucesso' | 'info';
    mensagem: string;
  };
  graficoEvolucao: Array<{
    data: string;
    faturamento: number;
    carros: number;
  }>;
  graficoFormasPagamento: Array<{
    forma: string;
    valor: number;
  }>;
}
