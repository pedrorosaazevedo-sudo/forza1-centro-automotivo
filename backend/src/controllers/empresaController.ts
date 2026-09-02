import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// FASE 2: Cadastro e Configuração da Empresa Lemoka
export const getEmpresaConfig = async (req: Request, res: Response) => {
  try {
    let config = await prisma.empresaConfig.findFirst();

    if (!config) {
      config = await prisma.empresaConfig.create({
        data: {
          razaoSocial: 'Lemoka Centro Automotivo LTDA',
          nomeFantasia: 'Lemoka',
          cnpj: '37.912.027/0001-60',
          cep: '26290-600',
          endereco: 'Av. Abilio Augusto Távora',
          numero: '4505',
          bairro: 'Valverde',
          cidade: 'Nova Iguaçu',
          uf: 'RJ'
        }
      });
    }

    return res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações da empresa:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
  }
};

export const updateEmpresaConfig = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.empresaConfig.findFirst();
    const data = req.body;

    // Assegurar que CNPJ e RazaoSocial sigam Lemoka se nao informados
    const updated = existing
      ? await prisma.empresaConfig.update({
          where: { id: existing.id },
          data: {
            ...data,
            razaoSocial: data.razaoSocial || 'Lemoka Centro Automotivo LTDA',
            nomeFantasia: data.nomeFantasia || 'Lemoka',
            cnpj: data.cnpj || '37.912.027/0001-60'
          }
        })
      : await prisma.empresaConfig.create({
          data: {
            ...data,
            razaoSocial: 'Lemoka Centro Automotivo LTDA',
            nomeFantasia: 'Lemoka',
            cnpj: '37.912.027/0001-60'
          }
        });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar configurações da empresa:', error);
    return res.status(500).json({ error: 'Erro ao salvar dados da empresa' });
  }
};

// FASE 6: Configuração Fiscal (Área Administrativa para informações do contador)
export const getConfiguracaoFiscal = async (req: Request, res: Response) => {
  try {
    let config = await prisma.configuracaoFiscal.findFirst();

    if (!config) {
      config = await prisma.configuracaoFiscal.create({
        data: {
          statusIntegracao: 'Pendente de configuração',
          ambiente: 'HOMOLOGACAO'
        }
      });
    }

    return res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração fiscal:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados fiscais' });
  }
};

export const updateConfiguracaoFiscal = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.configuracaoFiscal.findFirst();
    const data = req.body;

    const updated = existing
      ? await prisma.configuracaoFiscal.update({
          where: { id: existing.id },
          data
        })
      : await prisma.configuracaoFiscal.create({
          data
        });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar configuração fiscal:', error);
    return res.status(500).json({ error: 'Erro ao salvar dados fiscais' });
  }
};
