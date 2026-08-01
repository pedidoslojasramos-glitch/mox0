import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BranchOrder, Branch, Product, Supplier } from '../types';

/**
 * Render a unified, highly-organized corporate header with company logo
 */
function addHeaderWithLogo(
  doc: jsPDF,
  titleText: string,
  subtitleText: string,
  docNumberText: string,
  companyLogo?: string,
  badgeText?: string
) {
  // Top brand color accent line (cyan-600)
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, 210, 3, 'F');

  // Header background (clean light slate)
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 3, 210, 32, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(0, 35, 210, 35);

  // Logo Container Box (Left Side)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 6, 26, 25, 2, 2, 'FD');

  let logoDrawn = false;
  if (companyLogo) {
    try {
      let format: 'PNG' | 'JPEG' | 'WEBP' = 'PNG';
      if (companyLogo.includes('image/jpeg') || companyLogo.includes('image/jpg')) format = 'JPEG';
      if (companyLogo.includes('image/webp')) format = 'WEBP';

      doc.addImage(companyLogo, format, 13, 7, 24, 23);
      logoDrawn = true;
    } catch (e) {
      console.warn("Could not render logo in PDF, using vector fallback:", e);
    }
  }

  if (!logoDrawn) {
    // Vector Emblem Fallback
    doc.setFillColor(8, 145, 178);
    doc.ellipse(25, 18.5, 7, 7, 'F');
    doc.setDrawColor(14, 116, 144);
    doc.setLineWidth(0.6);
    doc.ellipse(25, 18.5, 9, 9, 'S');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('R', 22.3, 22.8);
  }

  const startTextX = 42;

  // Header Typography
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RAMOS MÓVEIS E ELETRODOMÉSTICOS', startTextX, 13);

  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(8, 145, 178); // cyan-600
  doc.text(titleText, startTextX, 19);

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(subtitleText, startTextX, 24);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Sistema MOX • Controle Logístico Integrado & Operacional', startTextX, 28.5);

  // Right Side Document Number Badge
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(150, 7, 48, 14, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(docNumberText, 174, 12.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('DOCUMENTO OFICIAL MOX', 174, 17.5, { align: 'center' });

  if (badgeText) {
    doc.setFillColor(236, 254, 255); // cyan-50
    doc.setDrawColor(8, 145, 178); // cyan-600
    doc.setLineWidth(0.3);
    doc.roundedRect(150, 22, 48, 9, 1, 1, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(8, 145, 178);
    doc.text(badgeText, 174, 28, { align: 'center' });
  }
}

/**
 * 1. ROMANEIO DE ENTREGA & GUIA DE TRANSPORTE
 */
export function generateRomaneioPDF(
  order: BranchOrder,
  branch: Branch | undefined,
  products: Product[],
  approverName: string,
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const orderIdText = `#${order.id.toUpperCase()}`;
  addHeaderWithLogo(
    doc,
    'ROMANEIO DE ENTREGA & GUIA DE TRANSPORTE',
    'Controle de Saída, Despacho e Transferência entre Filiais',
    orderIdText,
    companyLogo,
    `STATUS: ${order.status.toUpperCase()}`
  );

  // Info Cards Section
  const cardY = 40;
  const cardHeight = 35;

  // Card Left - Dados da Solicitação
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DA SOLICITAÇÃO / ORIGEM', 16, cardY + 6.5);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Protocolo ID:', 16, cardY + 13);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(orderIdText, 48, cardY + 13);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data Solicitação:', 16, cardY + 19);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  doc.text(orderDate, 48, cardY + 19);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Aprovado Por:', 16, cardY + 25);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const approver = order.approvedBy || approverName || 'Administrador Central';
  doc.text(approver, 48, cardY + 25);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Origem Carga:', 16, cardY + 31);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Centro de Distribuição Central', 48, cardY + 31);

  // Card Right - DESTINATÁRIO / FILIAL DESTINO (QUADRO AMARELO COM TEXTO PRETO)
  doc.setFillColor(254, 240, 138); // Background amarelo
  doc.setDrawColor(234, 179, 8); // Borda amarela destacada
  doc.setLineWidth(0.8);
  doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0); // Texto preto
  doc.text('DESTINATÁRIO / FILIAL DESTINO', 112, cardY + 6.5);

  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Texto preto
  doc.text('FILIAL DESTINO:', 112, cardY + 14);

  // PROMINENT BRANCH NAME (Large font size 13pt bold)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0); // Texto preto em destaque
  const branchName = branch?.name || 'Filial não identificada';
  doc.text(branchName.toUpperCase(), 112, cardY + 20);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // Texto preto
  doc.text('Endereço / Local:', 112, cardY + 26);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Texto preto
  doc.text(branch?.location || 'Não cadastrada', 145, cardY + 26);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // Texto preto
  doc.text('Gerente Responsável:', 112, cardY + 31);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Texto preto
  doc.text(branch?.manager || 'Não cadastrado', 145, cardY + 31);

  // Table Data Preparation
  const tableData: any[][] = [];
  let totalQuantity = 0;

  order.items.forEach((item, index) => {
    const product = products.find(p => p.id === item.productId);
    const code = product?.code || 'N/A';
    const name = product?.name || 'Produto Não Encontrado';
    const category = product?.category || 'Geral';
    const unit = product?.unit || 'un';
    totalQuantity += item.quantity;

    tableData.push([
      index + 1,
      code,
      name,
      category,
      unit,
      item.quantity
    ]);
  });

  // Table Render with increased font size
  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { left: 12, right: 12 },
    head: [['Seq', 'Código', 'Descrição do Produto', 'Classificação', 'Unid', 'Qtd Solicitada']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 30, fontStyle: 'bold', halign: 'right' }
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  if (finalY > 215) {
    doc.addPage();
    finalY = 20;
  }

  // Conferência Box
  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(0.6);
  doc.setFillColor(236, 254, 255);
  doc.roundedRect(12, finalY, 186, 26, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(8, 145, 178);
  doc.text('CONFERÊNCIA DE EMBALAGEM / VOLUMES (PREENCHIMENTO MANUAL NA CARGA/DESCARGA)', 16, finalY + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total de Itens na Lista: ${order.items.length} produto(s) | Qtd Total de Peças: ${totalQuantity} unid.`, 16, finalY + 12);
  doc.text('1. VOLUMES DESPACHADOS (EXPEDIÇÃO CENTRAL): [ ____________ ] VOLUMES (Caixa / Fardo / Palete)', 16, finalY + 18);
  doc.text('2. VOLUMES RECEBIDOS (FILIAL DESTINO):             [ ____________ ] VOLUMES (Conferido na entrega)', 16, finalY + 23);

  // Signatures
  let sigY = finalY + 34;

  if (sigY > 245) {
    doc.addPage();
    sigY = 30;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Signature Left
  doc.line(15, sigY + 12, 95, sigY + 12);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CONFERENTE EXPEDIÇÃO (Despacho / Saída)', 15, sigY + 17);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura do Responsável pela Carga', 15, sigY + 21);
  doc.text('Nome por Extenso: ___________________________', 15, sigY + 26);

  // Signature Right
  doc.line(111, sigY + 12, 191, sigY + 12);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('GERENTE DA FILIAL (Recebimento / Entrada)', 111, sigY + 17);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura de Recebimento do Destino', 111, sigY + 21);
  doc.text('Nome por Extenso: ___________________________', 111, sigY + 26);

  // Footer Stamp
  const footerY = 286;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('* Romaneio interno de transferência de mercadorias. Isento de valor fiscal.', 12, footerY);
  doc.text(`Emitido de forma integrada via Sistema MOX em ${new Date().toLocaleString('pt-BR')}`, 12, footerY + 3.5);

  doc.save(`Romaneio_Pedido_${order.id.toUpperCase()}.pdf`);
}

/**
 * 2. PEDIDO DE COMPRA / FORNECEDOR
 */
export function generatePurchaseOrderPDF(
  order: any,
  supplier: Supplier | undefined,
  products: Product[],
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const docIdText = `#PED-${order.id.toUpperCase()}`;
  addHeaderWithLogo(
    doc,
    'ORDEM DE COMPRA DE MERCADORIAS',
    'Documento de Solicitação de Suprimentos ao Fornecedor',
    docIdText,
    companyLogo,
    `STATUS: ${order.status.toUpperCase()}`
  );

  const cardY = 41;

  // Card Left - Pedido Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, cardY, 90, 28, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DA ORDEM DE COMPRA', 16, cardY + 5.5);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Nº da Ordem:', 16, cardY + 11);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(docIdText, 45, cardY + 11);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data de Emissão:', 16, cardY + 16);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.text(orderDate, 45, cardY + 16);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação Atual:', 16, cardY + 21);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(8, 145, 178);
  doc.text(order.status.toUpperCase(), 45, cardY + 21);

  // Card Right - Fornecedor Info
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, cardY, 90, 28, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DO FORNECEDOR', 112, cardY + 5.5);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Razão Social:', 112, cardY + 11);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(supplier?.name || 'Não informado', 138, cardY + 11);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CNPJ:', 112, cardY + 16);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(supplier?.cnpj || 'Não cadastrado', 138, cardY + 16);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Contato:', 112, cardY + 21);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(supplier?.contact || 'Não cadastrado', 138, cardY + 21);

  // Table Data
  let grandTotal = 0;
  const tableData = order.items.map((item: any) => {
    const product = products.find(p => p.id === item.productId);
    const unitPrice = product?.price || 0;
    const itemTotal = item.quantity * unitPrice;
    grandTotal += itemTotal;

    return [
      product?.code || 'N/A',
      product?.name || 'Produto Não Encontrado',
      product?.category || 'Geral',
      `${item.quantity} ${product?.unit || 'un'}`,
      `R$ ${unitPrice.toFixed(2)}`,
      `R$ ${itemTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: cardY + 32,
    margin: { left: 12, right: 12 },
    head: [['Código', 'Descrição do Produto', 'Categoria', 'Qtd', 'Vlr. Unitário', 'Total (R$)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32, fontStyle: 'bold', halign: 'right' }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  // Totals Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(108, finalY, 90, 16, 1.5, 1.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('VALOR TOTAL DA ORDEM DE COMPRA:', 112, finalY + 6.5);

  doc.setFontSize(11);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 194, finalY + 12, { align: 'right' });

  // Footer
  const footerY = 286;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado eletronicamente pelo Sistema MOX - Lojas Ramos.', 12, footerY);
  doc.text(`Data e hora de emissão: ${new Date().toLocaleString('pt-BR')}`, 12, footerY + 3.5);

  doc.save(`pedido_compra_${order.id}.pdf`);
}

/**
 * 3. PEDIDO DE ABASTECIMENTO DA FILIAL (RASCUNHO E OFICIAL)
 */
export function generateBranchOrderPDF(
  orderItems: { productId: string; quantity: number }[],
  isDraft: boolean,
  branch: Branch | undefined,
  products: Product[],
  orderObj?: any,
  orderNotes?: string,
  priority: 'normal' | 'urgent' = 'normal',
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const docIdText = isDraft
    ? 'RASCUNHO'
    : `#SOL-${(orderObj?.id || 'NOVO').toUpperCase()}`;

  const title = isDraft
    ? 'RASCUNHO DE PEDIDO DE ABASTECIMENTO'
    : 'SOLICITAÇÃO DE ABASTECIMENTO DE LOJA';

  addHeaderWithLogo(
    doc,
    title,
    'Guia Interna de Requisição e Reposição de Estoque de Filial',
    docIdText,
    companyLogo,
    isDraft ? 'RASCUNHO' : `PRIORIDADE: ${priority.toUpperCase()}`
  );

  const cardY = 40;
  const cardHeight = 35;

  // Card Left - FILIAL SOLICITANTE / DESTINO (QUADRO AMARELO COM TEXTO PRETO)
  doc.setFillColor(254, 240, 138); // Background amarelo
  doc.setDrawColor(234, 179, 8); // Borda amarela destacada
  doc.setLineWidth(0.8);
  doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0); // Texto preto
  doc.text('FILIAL SOLICITANTE / DESTINO', 16, cardY + 6.5);

  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Texto preto
  doc.text('LOJA / FILIAL:', 16, cardY + 14);

  // PROMINENT BRANCH NAME (Large font size 13pt bold)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0); // Texto preto em destaque
  const branchName = branch?.name || 'Filial não identificada';
  doc.text(branchName.toUpperCase(), 16, cardY + 20);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // Texto preto
  doc.text('Gerente Resp.:', 16, cardY + 26);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Texto preto
  doc.text(branch?.manager || 'Não cadastrado', 46, cardY + 26);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // Texto preto
  doc.text('Localização:', 16, cardY + 31);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Texto preto
  doc.text(branch?.location || 'Não cadastrado', 46, cardY + 31);

  // Card Right - Detalhes da Requisição
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETALHES DA REQUISIÇÃO', 112, cardY + 6.5);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data de Emissão:', 112, cardY + 14);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const dateText = isDraft
    ? new Date().toLocaleString('pt-BR')
    : new Date(orderObj?.createdAt || Date.now()).toLocaleString('pt-BR');
  doc.text(dateText, 146, cardY + 14);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Prioridade:', 112, cardY + 21);
  doc.setFont('Helvetica', 'bold');
  if (priority === 'urgent' || orderObj?.priority === 'urgent') {
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text('URGENTE', 146, cardY + 21);
  } else {
    doc.setTextColor(8, 145, 178); // cyan-600
    doc.text('NORMAL', 146, cardY + 21);
  }

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 112, cardY + 28);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const statusLabel = isDraft ? 'Rascunho' : (orderObj?.status?.toUpperCase() || 'SOLICITADO');
  doc.text(statusLabel, 146, cardY + 28);

  // Table Data
  let runningTotal = 0;
  let totalQty = 0;

  const tableData: any[][] = [];
  orderItems.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const subtotal = product.price * item.quantity;
    runningTotal += subtotal;
    totalQty += item.quantity;

    tableData.push([
      product.code,
      product.name,
      product.category || 'Geral',
      product.unit,
      item.quantity,
      `R$ ${product.price.toFixed(2)}`,
      `R$ ${subtotal.toFixed(2)}`
    ]);
  });

  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { left: 12, right: 12 },
    head: [['Código', 'Descrição do Produto', 'Categoria', 'Unid', 'Qtd', 'Vlr. Unit', 'Subtotal (R$)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 30, fontStyle: 'bold', halign: 'right' }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }

  // Summary and Notes Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, finalY, 100, 22, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('OBSERVAÇÕES DA FILIAL:', 16, finalY + 5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const noteText = isDraft ? orderNotes : (orderObj?.notes || 'Sem observações.');
  const splitNotes = doc.splitTextToSize(noteText || 'Nenhuma.', 92);
  doc.text(splitNotes, 16, finalY + 10);

  // Totals Card (Right)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(116, finalY, 82, 22, 1.5, 1.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('TOTAL DE ITENS:', 120, finalY + 6);
  doc.setTextColor(255, 255, 255);
  doc.text(`${totalQty} unidade(s)`, 192, finalY + 6, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('VALOR TOTAL ESTIMADO:', 120, finalY + 14);

  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text(`R$ ${runningTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 192, finalY + 14, { align: 'right' });

  // Footer
  const footerY = 286;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Lojas Ramos Distribuição LTDA. • Abastecimento Interno', 12, footerY);
  doc.text(`Página 1 de ${doc.getNumberOfPages()}`, 198, footerY, { align: 'right' });

  const fileName = isDraft ? 'rascunho_pedido_ramos.pdf' : `pedido_ramos_${orderObj?.id}.pdf`;
  doc.save(fileName);
}

/**
 * Generates box identification labels (Etiquetas de Caixa - Folha A4 por volume)
 */
export function generateBoxLabelPDF(
  order: any,
  branch: any,
  totalLabels: number = 1,
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const orderId = (order?.id || '').toUpperCase();
  const orderIdText = orderId.startsWith('PED-') ? orderId : `PED-${orderId}`;
  const branchName = (branch?.name || 'FILIAL NÃO IDENTIFICADA').toUpperCase();
  const branchLocation = branch?.location || 'Não cadastrada';
  const branchManager = branch?.manager || 'Não informado';

  // Extract city or location highlight
  let cityName = 'CIDADE DESTINO';
  if (branch?.location) {
    const parts = branch.location.split(/[-–,]/);
    if (parts.length > 1) {
      cityName = parts[parts.length - 1].trim().toUpperCase();
    } else {
      cityName = branch.location.trim().toUpperCase();
    }
  } else if (branch?.name) {
    cityName = branch.name.toUpperCase();
  }

  const currentDate = new Date().toLocaleDateString('pt-BR');

  for (let i = 1; i <= totalLabels; i++) {
    if (i > 1) {
      doc.addPage();
    }

    // Outer border (Margin frame around A4 sheet)
    doc.setDrawColor(3, 105, 161); // sky-700
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 281, 'S');

    // Inner subtle double line
    doc.setDrawColor(186, 230, 253); // sky-200
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277, 'S');

    // Header top bar - Lojas Ramos (LIGHT BLUE SHADE)
    doc.setFillColor(224, 242, 254); // Light sky blue (sky-100)
    doc.setDrawColor(186, 230, 253);
    doc.rect(10, 10, 190, 23, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900 dark text
    doc.text('LOJAS RAMOS - TRANSPORTE E LOGÍSTICA', 16, 20);

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`EMISSÃO: ${currentDate}`, 194, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(3, 105, 161); // sky-700
    doc.text('ETIQUETA DE IDENTIFICAÇÃO DE CAIXA / CARGA', 16, 28);

    // Yellow Box - VOLUME NUMBER BADGE (VERY PROMINENT)
    doc.setFillColor(254, 240, 138); // Yellow-200
    doc.setDrawColor(234, 179, 8); // Yellow-600
    doc.setLineWidth(1);
    doc.roundedRect(14, 36, 182, 22, 3, 3, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(161, 98, 7); // Yellow-800
    doc.text('VOLUME / CAIXA:', 22, 50);

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(`CAIXA ${i} DE ${totalLabels}`, 188, 51, { align: 'right' });

    // BIG HIGHLIGHTED BOX: CIDADE & FILIAL DESTINO (YELLOW HIGHLIGHT AS REQUESTED)
    doc.setFillColor(254, 240, 138); // Amarelo
    doc.setDrawColor(202, 138, 4); // Borda Amarela escura
    doc.setLineWidth(1.2);
    doc.roundedRect(14, 62, 182, 70, 4, 4, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('▶ CIDADE DESTINO DA CARGA:', 20, 72);

    // GIANT CITY NAME
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0); // Texto Preto Alto Contraste
    doc.text(cityName, 20, 84);

    // Divider inside destination box
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.line(20, 89, 190, 89);

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('▶ FILIAL RECEBEDORA / UNIDADE:', 20, 97);

    // GIANT BRANCH NAME
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(branchName, 20, 107);

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`Endereço/Local: ${branchLocation}`, 20, 117);
    doc.text(`Gerente Responsável: ${branchManager}`, 20, 124);

    // ORDER IDENTIFICATION CARD (LIGHT BLUE SHADE)
    doc.setFillColor(224, 242, 254); // Light sky blue (sky-100)
    doc.setDrawColor(186, 230, 253); // sky-200 border
    doc.setLineWidth(1);
    doc.roundedRect(14, 136, 182, 60, 4, 4, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(3, 105, 161); // sky-700
    doc.text('▶ CÓDIGO DO PEDIDO / SOLICITAÇÃO:', 20, 147);

    // GIANT ORDER ID
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(15, 23, 42); // Dark slate-900 text for strong visual pop
    doc.text(orderIdText, 20, 162);

    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.6);
    doc.line(20, 168, 190, 168);

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('ORIGEM DA CARGA: CENTRO DE DISTRIBUIÇÃO CENTRAL - LOJAS RAMOS', 20, 177);
    doc.text(`STATUS DO PEDIDO: EMBALADO E SEPARADO PARA EMBARQUE`, 20, 185);

    // VISUAL INDUSTRIAL CODE BOX (SIMULATED BARCODE LINES & LARGE DIGITS)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, 200, 182, 50, 3, 3, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('CÓDIGO DE RASTREABILIDADE INTERNA (LOGÍSTICA REVERSA E DISTRIBUIÇÃO):', 20, 209);

    // Simulated Barcode Lines
    let lineX = 22;
    const barWidths = [2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2];
    for (let b = 0; b < barWidths.length && lineX < 184; b++) {
      const w = barWidths[b];
      doc.setFillColor(15, 23, 42);
      doc.rect(lineX, 213, w, 22, 'F');
      lineX += w + (b % 2 === 0 ? 2 : 1);
    }

    doc.setFont('Courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`* ${orderIdText} - VOL-${i}/${totalLabels} *`, 100, 243, { align: 'center' });

    // FOOTER WARNING BOX
    doc.setFillColor(254, 242, 242); // Red light alert
    doc.setDrawColor(248, 113, 113);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, 254, 182, 27, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28); // Red-700
    doc.text('⚠ ATENÇÃO MOTORISTA / TRANSPORTE & CONFERÊNCIA:', 20, 262);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(127, 29, 29);
    doc.text('1. Esta etiqueta deve permanecer visível na parte externa da caixa durante todo o transporte.', 20, 268);
    doc.text('2. A filial recebedora deve conferir as quantidades com a nota de romaneio no momento do descarregamento.', 20, 274);
  }

  doc.save(`etiqueta_caixa_${orderId}.pdf`);
}

/**
 * Generates official EPI Term of Delivery PDF (Termo de Recebimento de EPI)
 */
export function generateEpiTermPDF(
  distribution: any,
  branches: Branch[],
  products: Product[],
  selectedBranchId: string = 'all',
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const distId = (distribution?.id || '').toUpperCase();
  const allBranchIds = Array.from(
    new Set(distribution?.items?.flatMap((i: any) => i.quantityPerBranch.map((q: any) => q.branchId)))
  ) as string[];

  const activeBranchIds = selectedBranchId && selectedBranchId !== 'all'
    ? allBranchIds.filter(id => id === selectedBranchId)
    : allBranchIds;

  let pageAdded = false;

  activeBranchIds.forEach((branchId) => {
    const branch = branches.find(b => b.id === branchId);
    const recipientName = distribution.recipients?.[branchId] || branch?.manager || '___________________________';

    // Collect items for this branch
    const branchItems = distribution.items.map((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      const qInfo = item.quantityPerBranch.find((q: any) => q.branchId === branchId);
      if (qInfo && qInfo.quantity > 0) {
        return {
          productName: prod?.name || 'EPI',
          code: prod?.code || '',
          unit: prod?.unit || 'un',
          quantity: qInfo.quantity
        };
      }
      return null;
    }).filter(Boolean);

    if (branchItems.length === 0) return;

    if (pageAdded) {
      doc.addPage();
    }
    pageAdded = true;

    // Header
    addHeaderWithLogo(
      doc,
      'LOJAS RAMOS',
      'Termo de Recebimento e Responsabilidade de EPI',
      `DIST-${distId}`,
      companyLogo,
      'EPI / SEGURANÇA'
    );

    let yPos = 42;

    // Info Box (Sucursal & Beneficiario)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, yPos, 186, 22, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('EMPRESA / SUCURSAL:', 16, yPos + 6);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Lojas Ramos - ${branch?.name || 'Sucursal'}`, 16, yPos + 12);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(branch?.location || '', 16, yPos + 17);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('BENEFICIÁRIO / RECEBEDOR ÚNICO:', 110, yPos + 6);
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text(recipientName, 110, yPos + 12);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Data: ${new Date(distribution.createdAt).toLocaleDateString('pt-BR')}`, 110, yPos + 17);

    yPos += 28;

    // Table of items
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Equipamentos de Proteção Individual (EPI) Entregues:', 12, yPos);
    yPos += 4;

    const tableBody = branchItems.map((bi: any) => [
      bi.productName,
      bi.code,
      `${bi.quantity} ${bi.unit}`
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: 12, right: 12 },
      head: [['Item / Equipamento', 'Código', 'Quantidade']],
      body: tableBody,
      headStyles: {
        fillColor: [16, 185, 129], // emerald-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 40, font: 'courier' },
        2: { cellWidth: 36, halign: 'center', fontStyle: 'bold' }
      },
      theme: 'grid'
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Declaration Box
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    
    let declText = branchItems.map((bi: any) => 
      `"Eu, ${recipientName}, confirmo o recebimento da quantidade ${bi.quantity} ${bi.unit} do item ${bi.productName} na presente data."`
    ).join('\n');
    declText += `\n\nDeclaro ter recebido da Lojas Ramos os Equipamentos de Proteção Individual (EPI) listados acima em perfeitas condições de uso e conservação, comprometendo-me a utilizá-los de forma adequada durante minhas atividades profissionais.`;

    const splitDecl = doc.splitTextToSize(declText, 180);
    const boxHeight = Math.max(28, splitDecl.length * 4 + 8);

    doc.roundedRect(12, yPos, 186, boxHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59); // emerald-950
    doc.text(splitDecl, 15, yPos + 6);

    yPos += boxHeight + 20;

    // Signature Block
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);

    // Left signature line
    doc.line(16, yPos, 90, yPos);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(recipientName, 16, yPos + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do Colaborador / Recebedor', 16, yPos + 9);
    doc.text(`Lojas Ramos - ${branch?.name || ''}`, 16, yPos + 13);

    // Right date line
    doc.line(120, yPos, 194, yPos);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Data: _____ / _____ / _________', 120, yPos + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Data do Recebimento na Sucursal', 120, yPos + 9);
  });

  const fileName = selectedBranchId && selectedBranchId !== 'all'
    ? `termo_epi_ramos_${selectedBranchId}_dist_${distId}.pdf`
    : `termos_epi_ramos_dist_${distId}.pdf`;

  doc.save(fileName);
}

/**
 * ROMANEIO DE ENVIO & GUIA DE TRANSPORTE DE DISTRIBUIÇÃO EM MASSA POR FILIAL
 */
export function generateDistributionRomaneioPDF(
  distribution: any,
  branches: Branch[],
  products: Product[],
  selectedBranchId: string = 'all',
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const distId = (distribution?.id || '').toUpperCase();
  const allBranchIds = Array.from(
    new Set(distribution?.items?.flatMap((i: any) => i.quantityPerBranch.map((q: any) => q.branchId)))
  ) as string[];

  const activeBranchIds = selectedBranchId && selectedBranchId !== 'all'
    ? allBranchIds.filter(id => id === selectedBranchId)
    : allBranchIds;

  let pageAdded = false;

  activeBranchIds.forEach((branchId) => {
    const branch = branches.find(b => b.id === branchId);
    const recipientName = distribution.recipients?.[branchId] || branch?.manager || 'Gerente / Responsável';

    // Collect items for this branch
    const branchItems: any[] = [];
    distribution.items.forEach((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      const qInfo = item.quantityPerBranch?.find((q: any) => q.branchId === branchId);
      if (qInfo && qInfo.quantity > 0) {
        branchItems.push({
          code: prod?.code || 'N/A',
          productName: prod?.name || 'Produto',
          category: prod?.category || 'Geral',
          unit: prod?.unit || 'un',
          quantity: qInfo.quantity
        });
      }
    });

    if (branchItems.length === 0) return;

    if (pageAdded) {
      doc.addPage();
    }
    pageAdded = true;

    addHeaderWithLogo(
      doc,
      'ROMANEIO DE ENVIO & GUIA DE TRANSPORTE',
      'Despacho de Mercadorias e Transferência em Lote entre Filiais',
      `#${distId}`,
      companyLogo,
      distribution.type === 'epi' ? 'TIPO: EPIs' : 'TIPO: MERCADORIAS'
    );

    const cardY = 40;
    const cardHeight = 35;

    // Card Left - Dados de Origem
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DADOS DA EXPEDIÇÃO / ORIGEM', 16, cardY + 6.5);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Protocolo ID:', 16, cardY + 13);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`#${distId}`, 48, cardY + 13);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Data Envio:', 16, cardY + 19);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const distDate = distribution.createdAt ? new Date(distribution.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    doc.text(distDate, 48, cardY + 19);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Origem Carga:', 16, cardY + 25);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Centro de Distribuição Central', 48, cardY + 25);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Tipo Lançamento:', 16, cardY + 31);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(distribution.type === 'epi' ? 'Distribuição de EPIs' : 'Distribuição Geral', 48, cardY + 31);

    // Card Right - DESTINATÁRIO / FILIAL DESTINO
    doc.setFillColor(254, 240, 138); // Yellow background
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text('DESTINATÁRIO / FILIAL DESTINO', 112, cardY + 6.5);

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('FILIAL DESTINO:', 112, cardY + 14);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const branchName = branch?.name || 'Filial não identificada';
    doc.text(branchName.toUpperCase(), 112, cardY + 20);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Endereço / Local:', 112, cardY + 26);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(branch?.location || 'Não cadastrada', 145, cardY + 26);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Gerente / Recebedor:', 112, cardY + 31);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(recipientName, 145, cardY + 31);

    // Table Data
    const tableData: any[][] = [];
    let totalQty = 0;
    branchItems.forEach((item, idx) => {
      totalQty += item.quantity;
      tableData.push([
        idx + 1,
        item.code,
        item.productName,
        item.category,
        item.unit,
        item.quantity,
        '[   ] OK'
      ]);
    });

    autoTable(doc, {
      startY: cardY + cardHeight + 5,
      margin: { left: 12, right: 12 },
      head: [['Seq', 'Código', 'Descrição do Produto', 'Classificação', 'Unid', 'Qtd Despachada', 'Conferência']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 30 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
        6: { cellWidth: 25, halign: 'center' }
      }
    });

    let yPos = (doc as any).lastAutoTable.finalY + 8;

    // Totalizer Box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, yPos, 186, 12, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL DE ITENS DESPACHADOS PARA A FILIAL: ${branchItems.length} VARIEDADES (${totalQty} UNIDADES TOTAL)`, 16, yPos + 7.5);

    yPos += 22;

    // Signature Block
    if (yPos > 240) {
      doc.addPage();
      yPos = 35;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);

    // Left signature
    doc.line(16, yPos, 90, yPos);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Expedição / Motorista Transportador', 16, yPos + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Conferência de Saída do Estoque Central', 16, yPos + 9);

    // Right signature
    doc.line(120, yPos, 194, yPos);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(recipientName, 120, yPos + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Recebedor Responsável - ${branch?.name || ''}`, 120, yPos + 9);
  });

  const fileName = selectedBranchId && selectedBranchId !== 'all'
    ? `romaneio_envio_ramos_${selectedBranchId}_dist_${distId}.pdf`
    : `romaneios_envio_ramos_dist_${distId}.pdf`;

  doc.save(fileName);
}

/**
 * COMPROVANTE DE ENTREGA & TERMO DE RECEBIMENTO POR FILIAL
 */
export function generateDistributionReceiptPDF(
  distribution: any,
  branches: Branch[],
  products: Product[],
  selectedBranchId: string = 'all',
  companyLogo?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const distId = (distribution?.id || '').toUpperCase();
  const allBranchIds = Array.from(
    new Set(distribution?.items?.flatMap((i: any) => i.quantityPerBranch.map((q: any) => q.branchId)))
  ) as string[];

  const activeBranchIds = selectedBranchId && selectedBranchId !== 'all'
    ? allBranchIds.filter(id => id === selectedBranchId)
    : allBranchIds;

  let pageAdded = false;

  activeBranchIds.forEach((branchId) => {
    const branch = branches.find(b => b.id === branchId);
    const recipientName = distribution.recipients?.[branchId] || branch?.manager || 'Gerente / Responsável';

    const branchItems: any[] = [];
    distribution.items.forEach((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      const qInfo = item.quantityPerBranch?.find((q: any) => q.branchId === branchId);
      if (qInfo && qInfo.quantity > 0) {
        branchItems.push({
          code: prod?.code || 'N/A',
          productName: prod?.name || 'Produto',
          category: prod?.category || 'Geral',
          unit: prod?.unit || 'un',
          quantity: qInfo.quantity
        });
      }
    });

    if (branchItems.length === 0) return;

    if (pageAdded) {
      doc.addPage();
    }
    pageAdded = true;

    addHeaderWithLogo(
      doc,
      'COMPROVANTE DE ENTREGA & TERMO DE RECEBIMENTO',
      'Confirmação de Recebimento de Mercadorias e Transferência Interna',
      `#${distId}`,
      companyLogo,
      'RECEBIMENTO FILIAL'
    );

    const cardY = 40;
    const cardHeight = 35;

    // Card Left - Dados da Carga
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DADOS DO REGISTRO DE DISTRIBUIÇÃO', 16, cardY + 6.5);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Protocolo ID:', 16, cardY + 13);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`#${distId}`, 48, cardY + 13);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Data Lançamento:', 16, cardY + 19);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const distDate = distribution.createdAt ? new Date(distribution.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    doc.text(distDate, 48, cardY + 19);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Origem Remetente:', 16, cardY + 25);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Almoxarifado / Estoque Central', 48, cardY + 25);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Modalidade:', 16, cardY + 31);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(distribution.type === 'epi' ? 'Termo EPI com Assinatura' : 'Comprovante Padrão de Entrega', 48, cardY + 31);

    // Card Right - FILIAL RECEBEDORA
    doc.setFillColor(236, 253, 245); // Emerald light background
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(6, 95, 70);
    doc.text('FILIAL RECEBEDORA', 112, cardY + 6.5);

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('NOME DA SUCURSAL:', 112, cardY + 14);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(6, 95, 70);
    const branchName = branch?.name || 'Filial não identificada';
    doc.text(branchName.toUpperCase(), 112, cardY + 20);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Endereço / Local:', 112, cardY + 26);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(branch?.location || 'Não cadastrada', 145, cardY + 26);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Gerente Responsável:', 112, cardY + 31);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(recipientName, 145, cardY + 31);

    // Table Data
    const tableData: any[][] = [];
    let totalQty = 0;
    branchItems.forEach((item, idx) => {
      totalQty += item.quantity;
      tableData.push([
        idx + 1,
        item.code,
        item.productName,
        item.category,
        item.unit,
        item.quantity
      ]);
    });

    autoTable(doc, {
      startY: cardY + cardHeight + 5,
      margin: { left: 12, right: 12 },
      head: [['Seq', 'Código', 'Descrição do Produto', 'Classificação', 'Unid', 'Qtd Entregue']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [6, 95, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 35 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, fontStyle: 'bold', halign: 'center' }
      }
    });

    let yPos = (doc as any).lastAutoTable.finalY + 8;

    // Declaration text box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.4);
    const declText = `Declaro que recebi da administração central da Lojas Ramos os produtos discriminados acima em perfeita quantidade, qualidade e integridade física para atendimento e uso operacional da sucursal ${branch?.name || ''}.`;
    const splitDecl = doc.splitTextToSize(declText, 180);
    const boxHeight = splitDecl.length * 4.5 + 6;

    doc.roundedRect(12, yPos, 186, boxHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text(splitDecl, 15, yPos + 6);

    yPos += boxHeight + 20;

    // Signatures
    if (yPos > 245) {
      doc.addPage();
      yPos = 35;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);

    // Left signature line
    doc.line(16, yPos, 90, yPos);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(recipientName, 16, yPos + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Assinatura do Gerente / Responsável`, 16, yPos + 9);
    doc.text(`Lojas Ramos - ${branch?.name || ''}`, 16, yPos + 13);

    // Right date line
    doc.line(120, yPos, 194, yPos);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Data: _____ / _____ / _________', 120, yPos + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Data Efetiva de Recebimento e Carimbo da Loja', 120, yPos + 9);
  });

  const fileName = selectedBranchId && selectedBranchId !== 'all'
    ? `comprovante_filial_ramos_${selectedBranchId}_dist_${distId}.pdf`
    : `comprovantes_filial_ramos_dist_${distId}.pdf`;

  doc.save(fileName);
}


