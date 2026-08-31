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

    const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const secret = config.jwtSecret || 'lemoka_prod_secret_key_8f93a1c2b5d4e6f7a8b9c0d1e2f3a4b5';

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
