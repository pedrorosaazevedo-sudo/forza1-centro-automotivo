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

  // FASE 3: Dados Opcionais Tomador / Cliente
  clienteDocumento?: string;
  clienteEmail?: string;
  clienteCep?: string;
  clienteEndereco?: string;
  clienteNumero?: string;
  clienteComplemento?: string;
  clienteBairro?: string;
  clienteCidade?: string;
  clienteUf?: string;

  // FASE 4/5: Status Fiscal e Dados NFS-e
  statusFiscal?: string;
  numeroNfse?: string;
  chaveNfse?: string;
  dataEmissaoNfse?: string;
  protocoloNfse?: string;
  codigoServico?: string;
  codigoTributacao?: string;
  valorTributavel?: number;
  impostosRetidos?: number;
  xmlNfse?: string;
  pdfNfseUrl?: string;
  mensagemErroFiscal?: string;
  respostaApiFiscal?: string;
}

export interface EmpresaConfig {
  id?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  logoUrl?: string;
  regimeTributario?: string;
  informacoesFiscaisAdicionais?: string;
}

export interface ConfiguracaoFiscal {
  id?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  regimeTributario?: string;
  enquadramentoTributario?: string;
  codigoServicoMunicipal?: string;
  codigoTributacao?: string;
  codigoTributacaoNacional?: string;
  descricaoPadraoServico?: string;
  aliquota?: number;
  retencoes?: string;
  ambiente?: string;
  statusIntegracao?: string;
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
    custoPecasTotais?: number;
    valorMaoDeObraTotal?: number;
    comissoesTotais: number;
    despesasTotais: number;
    lucroLiquido: number;
    carrosAtendidos: number;
    ticketMedio: number;
    margemLucroPercent: number;
  };
  indicadoresFiscais?: {
    nfseEmitidas: number;
    nfsePendentes: number;
    nfseErro: number;
    totalAtendimentos: number;
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
