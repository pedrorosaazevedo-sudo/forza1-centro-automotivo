import PDFDocument from 'pdfkit';
import { Atendimento, Mecanico } from '@prisma/client';
import path from 'path';
import fs from 'fs';

type AtendimentoComMecanico = Atendimento & { mecanico?: Mecanico };

export const generateReceiptPDF = (atendimento: AtendimentoComMecanico): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (data) => buffers.push(data));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header Background Accent
    doc.rect(0, 0, 595.28, 120).fill('#0f1117');

    // Draw Official Logo on Left
    const logoPath = path.join(__dirname, '../../public/logo.png');
    let hasLogo = false;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 40, 20, { height: 78 });
        hasLogo = true;
      } catch (e) {
        console.error('Erro ao renderizar logo no PDF:', e);
      }
    }

    if (!hasLogo) {
      doc.fillColor('#f5a623').fontSize(22).font('Helvetica-Bold').text('LEMOKA', 40, 30);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica').text('CENTRO AUTOMOTIVO', 40, 56);
      doc.fillColor('#94a3b8').fontSize(9).text('CNPJ: 37.912.027/0001-60 | Nova Iguaçu - RJ', 40, 76);
    }

    // Receipt Number & Date (Formatted cleanly on the right)
    const formattedDate = new Date(atendimento.data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.fillColor('#f5a623').fontSize(11).font('Helvetica-Bold').text(`ORDEM DE SERVIÇO / COMPROVANTE INTERNO #${atendimento.id.slice(0, 8).toUpperCase()}`, 260, 32, { align: 'right' });
    doc.fillColor('#cbd5e1').fontSize(9).font('Helvetica').text(`Data: ${formattedDate}`, 260, 50, { align: 'right' });
    doc.fillColor('#cbd5e1').fontSize(9).text(`Forma de Pagamento: ${atendimento.formaPagamento}`, 260, 65, { align: 'right' });
    doc.fillColor('#94a3b8').fontSize(8).text(`(Este documento é um comprovante de serviço interno, não substitui NFS-e)`, 260, 82, { align: 'right' });

    doc.moveDown(4);

    // Section 1: Dados do Cliente e Veículo
    let y = 145;
    doc.fillColor('#0f1117').fontSize(12).font('Helvetica-Bold').text('DADOS DO CLIENTE E VEÍCULO', 40, y);
    doc.strokeColor('#f5a623').lineWidth(1.5).moveTo(40, y + 16).lineTo(555, y + 16).stroke();

    y += 26;
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Cliente:', 40, y);
    doc.font('Helvetica').text(atendimento.nomeCliente + (atendimento.clienteDocumento ? ` (CPF/CNPJ: ${atendimento.clienteDocumento})` : ''), 100, y);

    doc.font('Helvetica-Bold').text('Telefone:', 340, y);
    doc.font('Helvetica').text(atendimento.telefoneCliente || 'Não informado', 400, y);

    y += 18;
    doc.font('Helvetica-Bold').text('Veículo:', 40, y);
    doc.font('Helvetica').text(atendimento.veiculo || 'Não informado', 100, y);

    doc.font('Helvetica-Bold').text('Mecânico:', 340, y);
    doc.font('Helvetica').text(atendimento.mecanico?.nome || 'Não especificado', 400, y);

    if (atendimento.clienteEndereco || atendimento.clienteCidade) {
      y += 18;
      doc.font('Helvetica-Bold').text('Endereço:', 40, y);
      const endStr = `${atendimento.clienteEndereco || ''} ${atendimento.clienteNumero || ''} ${atendimento.clienteBairro ? '- ' + atendimento.clienteBairro : ''} ${atendimento.clienteCidade ? '• ' + atendimento.clienteCidade : ''}`;
      doc.font('Helvetica').text(endStr.trim(), 100, y);
    }

    // Section 2: Descrição dos Serviços
    y += 35;
    doc.fillColor('#0f1117').fontSize(12).font('Helvetica-Bold').text('DETALHAMENTO DO SERVIÇO', 40, y);
    doc.strokeColor('#f5a623').lineWidth(1.5).moveTo(40, y + 16).lineTo(555, y + 16).stroke();

    y += 26;
    // Box for description
    doc.roundedRect(40, y, 515, 80, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#334155').fontSize(10).font('Helvetica').text(atendimento.descricaoServico, 52, y + 12, { width: 490 });

    // Section 3: Valores
    y += 100;
    doc.fillColor('#0f1117').fontSize(12).font('Helvetica-Bold').text('RESUMO FINANCEIRO', 40, y);
    doc.strokeColor('#f5a623').lineWidth(1.5).moveTo(40, y + 16).lineTo(555, y + 16).stroke();

    y += 26;
    const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    doc.fillColor('#475569').fontSize(10).font('Helvetica').text('Valor das Peças:', 40, y);
    doc.fillColor('#0f1117').font('Helvetica-Bold').text(formatCurrency(atendimento.valorPecas), 460, y, { align: 'right' });

    y += 20;
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text('Valor da Mão de Obra / Serviço:', 40, y);
    doc.fillColor('#0f1117').font('Helvetica-Bold').text(formatCurrency(atendimento.valorServico), 460, y, { align: 'right' });

    y += 25;
    // Total Box
    doc.roundedRect(40, y, 515, 36, 6).fill('#0f1117');
    doc.fillColor('#f5a623').fontSize(12).font('Helvetica-Bold').text('VALOR TOTAL:', 55, y + 10);
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(formatCurrency(atendimento.valorTotal), 440, y + 9, { align: 'right' });

    // Footer
    y += 110;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke();
    y += 10;
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Lemoka Centro Automotivo LTDA - CNPJ: 37.912.027/0001-60 - Com Deus Tudo é Possível', 40, y, { align: 'center' });
    doc.fillColor('#94a3b8').fontSize(8).text('Av. Abilio Augusto Távora, 4505 - Valverde, Nova Iguaçu - RJ, CEP 26290-600', 40, y + 14, { align: 'center' });

    doc.end();
  });
};
