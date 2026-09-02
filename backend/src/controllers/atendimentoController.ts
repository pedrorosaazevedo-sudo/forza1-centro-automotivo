import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { generateReceiptPDF } from '../services/pdfService';

const prisma = new PrismaClient();

export const createAtendimento = async (req: AuthRequest, res: Response) => {
  try {
    const {
      nomeCliente,
      telefoneCliente,
      veiculo,
      mecanicoId,
      descricaoServico,
      valorPecas,
      valorServico,
      percentualComissao,
      formaPagamento,
      data,

      // FASE 3: Dados do Cliente/Tomador (Opcionais)
      clienteDocumento,
      clienteEmail,
      clienteCep,
      clienteEndereco,
      clienteNumero,
      clienteComplemento,
      clienteBairro,
      clienteCidade,
      clienteUf
    } = req.body;

    if (!nomeCliente || !mecanicoId || !descricaoServico || !formaPagamento) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (Cliente, Mecânico, Descrição, Forma de Pagamento)' });
    }

    const pecasNum = Number(valorPecas) || 0;
    const servicoNum = Number(valorServico) || 0;
    const comissaoPercentNum = Number(percentualComissao) || 0;

    const valorTotal = pecasNum + servicoNum;
    const valorComissao = servicoNum * (comissaoPercentNum / 100);

    const atendimentoData = data ? new Date(data) : new Date();

    const atendimento = await prisma.atendimento.create({
      data: {
        nomeCliente,
        telefoneCliente: telefoneCliente || null,
        veiculo: veiculo || null,
        mecanicoId,
        descricaoServico,
        valorPecas: pecasNum,
        valorServico: servicoNum,
        valorTotal,
        percentualComissao: comissaoPercentNum,
        valorComissao,
        formaPagamento,
        data: atendimentoData,

        // Dados Tomador
        clienteDocumento: clienteDocumento || null,
        clienteEmail: clienteEmail || null,
        clienteCep: clienteCep || null,
        clienteEndereco: clienteEndereco || null,
        clienteNumero: clienteNumero || null,
        clienteComplemento: clienteComplemento || null,
        clienteBairro: clienteBairro || null,
        clienteCidade: clienteCidade || null,
        clienteUf: clienteUf || null,

        // Status Fiscal Padrão (Fase 4 - Não emitida / Pendente de integração)
        statusFiscal: 'Pendente de configuração'
      },
      include: {
        mecanico: true
      }
    });

    return res.status(201).json(atendimento);
  } catch (error) {
    console.error('Erro ao cadastrar atendimento:', error);
    return res.status(500).json({ error: 'Erro ao criar atendimento' });
  }
};

export const getAtendimentos = async (req: AuthRequest, res: Response) => {
  try {
    const { dataInicio, dataFim, mecanicoId, busca, statusFiscal } = req.query;

    const where: any = {};

    if (dataInicio && dataFim) {
      where.data = {
        gte: new Date(`${dataInicio}T00:00:00.000Z`),
        lte: new Date(`${dataFim}T23:59:59.999Z`)
      };
    }

    if (mecanicoId) {
      where.mecanicoId = mecanicoId as string;
    }

    if (statusFiscal) {
      where.statusFiscal = statusFiscal as string;
    }

    if (busca) {
      const term = busca as string;
      where.OR = [
        { nomeCliente: { contains: term, mode: 'insensitive' } },
        { veiculo: { contains: term, mode: 'insensitive' } },
        { descricaoServico: { contains: term, mode: 'insensitive' } },
        { clienteDocumento: { contains: term, mode: 'insensitive' } }
      ];
    }

    const atendimentos = await prisma.atendimento.findMany({
      where,
      include: { mecanico: true },
      orderBy: { data: 'desc' }
    });

    return res.json(atendimentos);
  } catch (error) {
    console.error('Erro ao listar atendimentos:', error);
    return res.status(500).json({ error: 'Erro ao listar atendimentos' });
  }
};

export const getAtendimentoById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
      include: { mecanico: true }
    });

    if (!atendimento) {
      return res.status(404).json({ error: 'Atendimento não encontrado' });
    }

    return res.json(atendimento);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar atendimento' });
  }
};

export const updateAtendimento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nomeCliente,
      telefoneCliente,
      veiculo,
      mecanicoId,
      descricaoServico,
      valorPecas,
      valorServico,
      percentualComissao,
      formaPagamento,
      data,

      // Dados Tomador
      clienteDocumento,
      clienteEmail,
      clienteCep,
      clienteEndereco,
      clienteNumero,
      clienteComplemento,
      clienteBairro,
      clienteCidade,
      clienteUf,

      statusFiscal
    } = req.body;

    const pecasNum = Number(valorPecas) || 0;
    const servicoNum = Number(valorServico) || 0;
    const comissaoPercentNum = Number(percentualComissao) || 0;

    const valorTotal = pecasNum + servicoNum;
    const valorComissao = servicoNum * (comissaoPercentNum / 100);

    const atendimentoAtualizado = await prisma.atendimento.update({
      where: { id },
      data: {
        nomeCliente,
        telefoneCliente,
        veiculo,
        mecanicoId,
        descricaoServico,
        valorPecas: pecasNum,
        valorServico: servicoNum,
        valorTotal,
        percentualComissao: comissaoPercentNum,
        valorComissao,
        formaPagamento,

        ...(clienteDocumento !== undefined ? { clienteDocumento } : {}),
        ...(clienteEmail !== undefined ? { clienteEmail } : {}),
        ...(clienteCep !== undefined ? { clienteCep } : {}),
        ...(clienteEndereco !== undefined ? { clienteEndereco } : {}),
        ...(clienteNumero !== undefined ? { clienteNumero } : {}),
        ...(clienteComplemento !== undefined ? { clienteComplemento } : {}),
        ...(clienteBairro !== undefined ? { clienteBairro } : {}),
        ...(clienteCidade !== undefined ? { clienteCidade } : {}),
        ...(clienteUf !== undefined ? { clienteUf } : {}),
        ...(statusFiscal ? { statusFiscal } : {}),

        ...(data ? { data: new Date(data) } : {})
      },
      include: { mecanico: true }
    });

    return res.json(atendimentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    return res.status(500).json({ error: 'Erro ao atualizar atendimento' });
  }
};

export const deleteAtendimento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.atendimento.delete({ where: { id } });
    return res.json({ message: 'Atendimento excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir atendimento' });
  }
};

export const downloadPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
      include: { mecanico: true }
    });

    if (!atendimento) {
      return res.status(404).json({ error: 'Atendimento não encontrado' });
    }

    const pdfBuffer = await generateReceiptPDF(atendimento);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Nota_Forza1_${atendimento.nomeCliente.replace(/\s+/g, '_')}_${atendimento.id.slice(0, 6)}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro ao gerar PDF do atendimento' });
  }
};
