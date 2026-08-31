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

    // Draw Official Logo if available
    const logoPath = path.join(__dirname, '../../public/logo.png');
    let hasLogo = false;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 40, 22, { height: 50 });
        hasLogo = true;
      } catch (e) {
        console.error('Erro ao renderizar logo no PDF:', e);
      }
    }

    const textX = hasLogo ? 180 : 40;

    // Title & Subtitle
    doc.fillColor('#f5a623').fontSize(20).font('Helvetica-Bold').text('LEMOKA', textX, 30);
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica').text('CENTRO AUTOMOTIVO', textX, 54);
    doc.fillColor('#94a3b8').fontSize(9).text('Nova Iguaçu - RJ | Atendimento Especializado', textX, 74);

    // Receipt Number & Date
    const formattedDate = new Date(atendimento.data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.fillColor('#f5a623').fontSize(12).font('Helvetica-Bold').text(`NOTA DE ATENDIMENTO #${atendimento.id.slice(0, 8).toUpperCase()}`, 330, 35, { align: 'right' });
    doc.fillColor('#cbd5e1').fontSize(10).font('Helvetica').text(`Data: ${formattedDate}`, 330, 55, { align: 'right' });
    doc.fillColor('#cbd5e1').fontSize(10).text(`Pagamento: ${atendimento.formaPagamento}`, 330, 72, { align: 'right' });

    doc.moveDown(4);

    // Section 1: Dados do Cliente e Veículo
    let y = 145;
    doc.fillColor('#0f1117').fontSize(12).font('Helvetica-Bold').text('DADOS DO CLIENTE E VEÍCULO', 40, y);
    doc.strokeColor('#f5a623').lineWidth(1.5).moveTo(40, y + 16).lineTo(555, y + 16).stroke();

    y += 26;
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Cliente:', 40, y);
    doc.font('Helvetica').text(atendimento.nomeCliente, 100, y);

    doc.font('Helvetica-Bold').text('Telefone:', 340, y);
    doc.font('Helvetica').text(atendimento.telefoneCliente || 'Não informado', 400, y);

    y += 18;
    doc.font('Helvetica-Bold').text('Veículo:', 40, y);
    doc.font('Helvetica').text(atendimento.veiculo || 'Não informado', 100, y);

    doc.font('Helvetica-Bold').text('Mecânico:', 340, y);
    doc.font('Helvetica').text(atendimento.mecanico?.nome || 'Não especificado', 400, y);

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
    y += 120;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke();
    y += 12;
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Lemoka Centro Automotivo - Com Deus Tudo é Possível', 40, y, { align: 'center' });
    doc.fillColor('#94a3b8').fontSize(8).text('Nova Iguaçu, RJ | Telefone & WhatsApp de Atendimento', 40, y + 14, { align: 'center' });

    doc.end();
  });
};
