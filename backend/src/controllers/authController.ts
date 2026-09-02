import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const emailClean = email.toLowerCase().trim();

    let usuario = await prisma.usuario.findUnique({ where: { email: emailClean } });
    
    // Se o banco estiver limpo ou sem usuários, popula automaticamente os usuários padrão da Forza 1
    const totalUsuarios = await prisma.usuario.count();
    if (totalUsuarios === 0 || !usuario) {
      if (emailClean === 'admin@forza1.com.br' || emailClean === 'operacional@forza1.com.br' || totalUsuarios === 0) {
        const senhaAdminHash = await bcrypt.hash('admin123', 10);
        const senhaOpHash = await bcrypt.hash('forza123', 10);

        await prisma.usuario.upsert({
          where: { email: 'admin@forza1.com.br' },
          update: {},
          create: { email: 'admin@forza1.com.br', senhaHash: senhaAdminHash, papel: 'ADMIN' }
        });

        await prisma.usuario.upsert({
          where: { email: 'operacional@forza1.com.br' },
          update: {},
          create: { email: 'operacional@forza1.com.br', senhaHash: senhaOpHash, papel: 'OPERACIONAL' }
        });

        usuario = await prisma.usuario.findUnique({ where: { email: emailClean } });
      }
    }

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const secret = config.jwtSecret || 'forza1_prod_secret_key_8f93a1c2b5d4e6f7a8b9c0d1e2f3a4b5';

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, papel: usuario.papel },
      secret,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        papel: usuario.papel
      }
    });
  } catch (error: any) {
    console.error('Erro detalhado no login:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login', details: error?.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, papel: true, createdAt: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(usuario);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};
