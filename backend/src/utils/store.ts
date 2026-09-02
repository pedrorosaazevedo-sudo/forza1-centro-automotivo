import crypto from 'crypto';

// In-Memory Data Store com Dados Iniciais da Forza 1 Centro Automotivo
export interface MecanicoData {
  id: string;
  nome: string;
  especialidade: string;
  createdAt: Date;
}

export interface DespesaData {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  dataCadastro: Date;
}

export interface AtendimentoData {
  id: string;
  data: Date;
  nomeCliente: string;
  telefoneCliente?: string | null;
  veiculo?: string | null;
  mecanicoId: string;
  mecanico?: MecanicoData;
  descricaoServico: string;
  valorPecas: number;
  valorServico: number;
  valorTotal: number;
  percentualComissao: number;
  valorComissao: number;
  formaPagamento: string;
  clienteDocumento?: string | null;
  clienteEmail?: string | null;
  clienteCep?: string | null;
  clienteEndereco?: string | null;
  clienteNumero?: string | null;
  clienteComplemento?: string | null;
  clienteBairro?: string | null;
  clienteCidade?: string | null;
  clienteUf?: string | null;
  statusFiscal: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrafegoData {
  id: string;
  semanaReferencia: Date;
  mensagensRecebidas: number;
  valorInvestido: number;
  createdAt: Date;
}

class MemoryStore {
  public mecanicos: MecanicoData[] = [
    { id: 'mec-1', nome: 'Marcos Souza', especialidade: 'Suspensão, Freios & Alinhamento', createdAt: new Date() },
    { id: 'mec-2', nome: 'Carlos Eduardo', especialidade: 'Injeção Eletrônica & Motor', createdAt: new Date() },
    { id: 'mec-3', nome: 'Roberto Lima', especialidade: 'Ar Condicionado & Elétrica', createdAt: new Date() }
  ];

  public despesas: DespesaData[] = [
    { id: 'desp-1', nome: 'Aluguel do Galpão', categoria: 'Imóvel', valor: 3500.00, dataCadastro: new Date() },
    { id: 'desp-2', nome: 'Energia Elétrica (Light)', categoria: 'Utilidades', valor: 680.00, dataCadastro: new Date() },
    { id: 'desp-3', nome: 'Água e Esgoto (Águas do Rio)', categoria: 'Utilidades', valor: 190.00, dataCadastro: new Date() },
    { id: 'desp-4', nome: 'Internet Fibra 600MB', categoria: 'Telecom', valor: 149.90, dataCadastro: new Date() },
    { id: 'desp-5', nome: 'Contabilidade Mensal', categoria: 'Serviços', valor: 500.00, dataCadastro: new Date() }
  ];

  public atendimentos: AtendimentoData[] = [
    {
      id: 'atend-1',
      data: new Date(),
      nomeCliente: 'João Pedro Silva',
      telefoneCliente: '(21) 98765-4321',
      veiculo: 'Chevrolet Onix 1.0 2021',
      mecanicoId: 'mec-1',
      mecanico: { id: 'mec-1', nome: 'Marcos Souza', especialidade: 'Suspensão, Freios & Alinhamento', createdAt: new Date() },
      descricaoServico: 'Troca de pastilhas de freio dianteiras, discos e sangria do sistema de freios.',
      valorPecas: 280.00,
      valorServico: 220.00,
      valorTotal: 500.00,
      percentualComissao: 25.0,
      valorComissao: 55.00,
      formaPagamento: 'PIX',
      statusFiscal: 'Pendente de configuração',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'atend-2',
      data: new Date(),
      nomeCliente: 'Mariana Costa',
      telefoneCliente: '(21) 97123-8899',
      veiculo: 'Hyundai HB20 1.6 2019',
      mecanicoId: 'mec-2',
      mecanico: { id: 'mec-2', nome: 'Carlos Eduardo', especialidade: 'Injeção Eletrônica & Motor', createdAt: new Date() },
      descricaoServico: 'Limpeza de bicos injetores, troca de velas de ignição e filtro de combustível.',
      valorPecas: 190.00,
      valorServico: 260.00,
      valorTotal: 450.00,
      percentualComissao: 30.0,
      valorComissao: 78.00,
      formaPagamento: 'CREDITO',
      statusFiscal: 'Pendente de configuração',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  public trafego: TrafegoData[] = [
    {
      id: 'traf-1',
      semanaReferencia: new Date(),
      mensagensRecebidas: 48,
      valorInvestido: 350.00,
      createdAt: new Date()
    }
  ];

  // Mecânicos Methods
  public addMecanico(nome: string, especialidade: string = 'Geral'): MecanicoData {
    const item: MecanicoData = {
      id: `mec-${crypto.randomUUID()}`,
      nome,
      especialidade: especialidade || 'Geral',
      createdAt: new Date()
    };
    this.mecanicos.push(item);
    return item;
  }

  public updateMecanico(id: string, nome: string, especialidade: string): MecanicoData | null {
    const item = this.mecanicos.find(m => m.id === id);
    if (item) {
      if (nome) item.nome = nome;
      if (especialidade) item.especialidade = especialidade;
      return item;
    }
    return null;
  }

  public deleteMecanico(id: string): boolean {
    const idx = this.mecanicos.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.mecanicos.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Despesas Methods
  public addDespesa(nome: string, categoria: string, valor: number): DespesaData {
    const item: DespesaData = {
      id: `desp-${crypto.randomUUID()}`,
      nome,
      categoria: categoria || 'Geral',
      valor: Number(valor) || 0,
      dataCadastro: new Date()
    };
    this.despesas.push(item);
    return item;
  }

  public updateDespesa(id: string, nome: string, categoria: string, valor: number): DespesaData | null {
    const item = this.despesas.find(d => d.id === id);
    if (item) {
      if (nome) item.nome = nome;
      if (categoria) item.categoria = categoria;
      if (valor !== undefined) item.valor = Number(valor);
      return item;
    }
    return null;
  }

  public deleteDespesa(id: string): boolean {
    const idx = this.despesas.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.despesas.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Atendimentos Methods
  public addAtendimento(data: Partial<AtendimentoData>): AtendimentoData {
    const mecanico = this.mecanicos.find(m => m.id === data.mecanicoId) || {
      id: data.mecanicoId || 'mec-1',
      nome: 'Marcos Souza',
      especialidade: 'Geral',
      createdAt: new Date()
    };

    const valorPecas = Number(data.valorPecas) || 0;
    const valorServico = Number(data.valorServico) || 0;
    const valorTotal = valorPecas + valorServico;
    const percentualComissao = Number(data.percentualComissao) || 0;
    const valorComissao = valorServico * (percentualComissao / 100);

    const item: AtendimentoData = {
      id: `atend-${crypto.randomUUID()}`,
      data: data.data ? new Date(data.data) : new Date(),
      nomeCliente: data.nomeCliente || 'Cliente',
      telefoneCliente: data.telefoneCliente || '',
      veiculo: data.veiculo || 'Veículo Padrão',
      mecanicoId: mecanico.id,
      mecanico,
      descricaoServico: data.descricaoServico || 'Serviço Automotivo',
      valorPecas,
      valorServico,
      valorTotal,
      percentualComissao,
      valorComissao,
      formaPagamento: data.formaPagamento || 'PIX',
      clienteDocumento: data.clienteDocumento || null,
      clienteEmail: data.clienteEmail || null,
      clienteCep: data.clienteCep || null,
      clienteEndereco: data.clienteEndereco || null,
      clienteNumero: data.clienteNumero || null,
      clienteComplemento: data.clienteComplemento || null,
      clienteBairro: data.clienteBairro || null,
      clienteCidade: data.clienteCidade || null,
      clienteUf: data.clienteUf || null,
      statusFiscal: data.statusFiscal || 'Pendente de configuração',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.atendimentos.unshift(item);
    return item;
  }

  public updateAtendimento(id: string, data: Partial<AtendimentoData>): AtendimentoData | null {
    const item = this.atendimentos.find(a => a.id === id);
    if (item) {
      Object.assign(item, data);
      item.updatedAt = new Date();
      if (data.mecanicoId) {
        item.mecanico = this.mecanicos.find(m => m.id === data.mecanicoId) || item.mecanico;
      }
      return item;
    }
    return null;
  }

  public deleteAtendimento(id: string): boolean {
    const idx = this.atendimentos.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.atendimentos.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Tráfego Methods
  public addTrafego(mensagensRecebidas: number, valorInvestido: number, semanaReferencia?: Date): TrafegoData {
    const item: TrafegoData = {
      id: `traf-${crypto.randomUUID()}`,
      semanaReferencia: semanaReferencia ? new Date(semanaReferencia) : new Date(),
      mensagensRecebidas: Number(mensagensRecebidas) || 0,
      valorInvestido: Number(valorInvestido) || 0,
      createdAt: new Date()
    };
    this.trafego.unshift(item);
    return item;
  }
}

export const memoryStore = new MemoryStore();
