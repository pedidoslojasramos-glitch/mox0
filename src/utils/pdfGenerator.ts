import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BranchOrder, Branch, Product, Supplier } from '../types';

/**
 * Brand colors for Lojas Ramos / RAMOS MÓVEIS E ELETRODOMÉSTICOS
 */
export const RAMOS_COLORS = {
  orange: [243, 112, 33] as [number, number, number], // #F37021 - Laranja Ramos
  blue: [11, 79, 156] as [number, number, number],    // #0B4F9C - Azul Ramos
  darkSlate: [15, 23, 42] as [number, number, number], // #0F172A
  lightBg: [248, 250, 252] as [number, number, number], // #F8FAFC
  borderSlate: [226, 232, 240] as [number, number, number] // #E2E8F0
};

/**
 * Draws the mandatory brand bands stacked vertically (Blue on top, Orange underneath)
 * running across the full page width at the top (header) and bottom (footer).
 */
export function drawBrandBands(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth(); // Standard A4: 210 mm
  const ph = doc.internal.pageSize.getHeight(); // Standard A4: 297 mm

  // --- HEADER STACKED BANDS (Full width) ---
  // Top band: Azul Ramos (0 to 210 mm, y = 0 to 8 mm)
  doc.setFillColor(...RAMOS_COLORS.blue);
  doc.rect(0, 0, pw, 8, 'F');

  // Second band: Laranja Ramos (0 to 210 mm, y = 8 to 12 mm)
  doc.setFillColor(...RAMOS_COLORS.orange);
  doc.rect(0, 8, pw, 4, 'F');

  // --- FOOTER STACKED BANDS (Full width, bottom edge) ---
  // Upper footer band: Laranja Ramos (0 to 210 mm, y = ph - 12 to ph - 8 mm)
  doc.setFillColor(...RAMOS_COLORS.orange);
  doc.rect(0, ph - 12, pw, 4, 'F');

  // Lower footer band: Azul Ramos (0 to 210 mm, y = ph - 8 to ph)
  doc.setFillColor(...RAMOS_COLORS.blue);
  doc.rect(0, ph - 8, pw, 8, 'F');
}

/**
 * Calculates a fitting font size so that `text` stays within `maxWidth` in jsPDF.
 */
export function getFittingFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number = 6
): number {
  if (!text) return maxFontSize;
  doc.setFontSize(maxFontSize);
  let currentSize = maxFontSize;
  while (currentSize > minFontSize && doc.getTextWidth(text) > maxWidth) {
    currentSize -= 0.5;
    doc.setFontSize(currentSize);
  }
  return currentSize;
}

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
  // Draw the 1cm top and bottom brand bands first
  drawBrandBands(doc);

  // Header card background (y = 11.5 to 39.5 mm)
  doc.setFillColor(...RAMOS_COLORS.lightBg);
  doc.rect(0, 11.5, 210, 28, 'F');
  doc.setDrawColor(...RAMOS_COLORS.borderSlate);
  doc.setLineWidth(0.4);
  doc.line(0, 39.5, 210, 39.5);

  // Logo Container Box (Left side)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 13.5, 28, 23, 2, 2, 'FD');

  let logoDrawn = false;
  if (companyLogo) {
    try {
      let format: 'PNG' | 'JPEG' | 'WEBP' = 'PNG';
      if (companyLogo.includes('image/jpeg') || companyLogo.includes('image/jpg')) format = 'JPEG';
      else if (companyLogo.includes('image/webp')) format = 'WEBP';

      doc.addImage(companyLogo, format, 13, 14.5, 26, 21);
      logoDrawn = true;
    } catch (e) {
      console.warn("Could not render logo in PDF, using vector fallback:", e);
    }
  }

  if (!logoDrawn) {
    // Vector Emblem Fallback (RAMOS brand colors)
    doc.setFillColor(...RAMOS_COLORS.orange);
    doc.ellipse(26, 25, 7.5, 7.5, 'F');
    doc.setDrawColor(...RAMOS_COLORS.blue);
    doc.setLineWidth(0.8);
    doc.ellipse(26, 25, 9.5, 9.5, 'S');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('R', 23.5, 29);
  }

  const startTextX = 43;

  // Header Typography
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RAMOS MÓVEIS E ELETRODOMÉSTICOS', startTextX, 19, { maxWidth: 102 });

  let titleFontSize = getFittingFontSize(doc, titleText, 102, 9.5, 7);
  doc.setFontSize(titleFontSize);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...RAMOS_COLORS.orange); // Laranja Ramos
  doc.text(titleText, startTextX, 24.5, { maxWidth: 102 });

  let subFontSize = getFittingFontSize(doc, subtitleText, 102, 7.5, 6);
  doc.setFontSize(subFontSize);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(subtitleText, startTextX, 29.5, { maxWidth: 102 });

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Sistema MOX • Controle Logístico Integrado & Operacional', startTextX, 34, { maxWidth: 102 });

  // Right Side Document Number Badge
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(148, 13.5, 50, 13, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  const docNumFontSize = getFittingFontSize(doc, docNumberText, 46, 8.5, 5.5);
  doc.setFontSize(docNumFontSize);
  const splitDocNum = doc.splitTextToSize(docNumberText, 46);
  if (splitDocNum.length > 1) {
    doc.text(splitDocNum[0], 173, 17, { align: 'center' });
    doc.text(splitDocNum[1], 173, 19.5, { align: 'center' });
  } else {
    doc.text(docNumberText, 173, 18.5, { align: 'center' });
  }

  doc.setFontSize(6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('DOCUMENTO OFICIAL MOX', 173, 23.5, { align: 'center', maxWidth: 46 });

  if (badgeText) {
    doc.setFillColor(254, 243, 199); // amber-100 / warm accent
    doc.setDrawColor(...RAMOS_COLORS.orange); // Laranja Ramos
    doc.setLineWidth(0.4);
    doc.roundedRect(148, 28, 50, 8.5, 1, 1, 'FD');

    doc.setFont('Helvetica', 'bold');
    const badgeFontSize = getFittingFontSize(doc, badgeText, 46, 7.5, 5.5);
    doc.setFontSize(badgeFontSize);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(badgeText, 173, 33.5, { align: 'center', maxWidth: 46 });
  }
}

/**
 * Apply brand headers, logo, 1cm orange/blue bands, and dynamic footer page numbers to all pages.
 */
function applyBrandHeaderFooterToAllPages(
  doc: jsPDF,
  titleText: string,
  subtitleText: string,
  docNumberText: string,
  companyLogo?: string,
  badgeText?: string,
  footerNote?: string
) {
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Ensure header with logo and top/bottom bands are rendered on every page
    addHeaderWithLogo(doc, titleText, subtitleText, docNumberText, companyLogo, badgeText);

    // Footer text positioned neatly above the bottom 1cm brand band
    const footerY = 282; // mm
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    const note = footerNote || '* Documento oficial gerado via Sistema MOX • Lojas Ramos.';
    doc.text(note, 12, footerY, { maxWidth: 160 });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Página ${i} de ${totalPages}`, 198, footerY, { align: 'right' });
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
  const cardY = 43;

  // 1. Calculate text line splits and fitting font sizes
  const idFontSize = getFittingFontSize(doc, orderIdText, 50, 8.5, 6);
  doc.setFontSize(idFontSize);
  const splitId = doc.splitTextToSize(orderIdText, 50);

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  const splitDate = doc.splitTextToSize(orderDate, 50);

  const approver = order.approvedBy || approverName || 'Administrador Central';
  const appFontSize = getFittingFontSize(doc, approver, 50, 8.5, 6.5);
  doc.setFontSize(appFontSize);
  const splitApp = doc.splitTextToSize(approver, 50);

  const rightTitle = 'DESTINATÁRIO / FILIAL DESTINO';
  const rightTitleFontSize = getFittingFontSize(doc, rightTitle, 82, 9.5, 7.5);

  const branchName = (branch?.name || 'Filial não identificada').toUpperCase();
  const bFontSize = getFittingFontSize(doc, branchName, 82, 10.5, 7.5);
  doc.setFontSize(bFontSize);
  const splitBranch = doc.splitTextToSize(branchName, 82);

  const locText = branch?.location || 'Não cadastrada';
  const locFontSize = getFittingFontSize(doc, locText, 48, 8.5, 6.5);
  doc.setFontSize(locFontSize);
  const splitLoc = doc.splitTextToSize(locText, 48);

  const mgrText = branch?.manager || 'Não cadastrado';
  const mgrFontSize = getFittingFontSize(doc, mgrText, 48, 8.5, 6.5);
  doc.setFontSize(mgrFontSize);
  const splitMgr = doc.splitTextToSize(mgrText, 48);

  // Compute total card heights required
  const leftRequiredH = 13 + (splitId.length * 5) + (splitDate.length * 5) + (splitApp.length * 5) + 6;
  const rightRequiredH = 13 + (splitBranch.length * 5) + (splitLoc.length * 4.8) + (splitMgr.length * 4.8) + 6;
  const cardHeight = Math.max(36, leftRequiredH, rightRequiredH);

  // 2. Draw Card Backgrounds FIRST
  // Card Left - Dados da Solicitação
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

  // Card Right - DESTINATÁRIO / FILIAL DESTINO
  doc.setFillColor(254, 240, 138); // Yellow background
  doc.setDrawColor(234, 179, 8); // Yellow border
  doc.setLineWidth(0.8);
  doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

  // 3. Draw Left Card Text
  let leftY = cardY + 6.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DA SOLICITAÇÃO / ORIGEM', 16, leftY);
  leftY += 6.5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Protocolo ID:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(idFontSize);
  doc.text(splitId, 48, leftY);
  leftY += Math.max(1, splitId.length) * 5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data Solicitação:', 16, leftY);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(splitDate, 48, leftY);
  leftY += Math.max(1, splitDate.length) * 5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Aprovado Por:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(appFontSize);
  doc.text(splitApp, 48, leftY);
  leftY += Math.max(1, splitApp.length) * 5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Origem Carga:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Centro de Distribuição Central', 48, leftY, { maxWidth: 50 });

  // 4. Draw Right Card Text
  let rightY = cardY + 6.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(rightTitleFontSize);
  doc.setTextColor(0, 0, 0);
  doc.text(rightTitle, 112, rightY);
  rightY += 6.5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FILIAL DESTINO:', 112, rightY);
  rightY += 4.5;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(bFontSize);
  doc.setTextColor(0, 0, 0);
  doc.text(splitBranch, 112, rightY);
  rightY += Math.max(1, splitBranch.length) * 5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Endereço / Local:', 112, rightY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(locFontSize);
  doc.text(splitLoc, 148, rightY);
  rightY += Math.max(1, splitLoc.length) * 4.8;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Gerente Responsável:', 112, rightY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(mgrFontSize);
  doc.text(splitMgr, 148, rightY);

  // Table Data
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

  // Table Render
  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { top: 43, bottom: 22, left: 12, right: 12 },
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

  if (finalY > 205) {
    doc.addPage();
    finalY = 43;
  }

  // Conferência Box
  doc.setDrawColor(...RAMOS_COLORS.blue);
  doc.setLineWidth(0.6);
  doc.setFillColor(236, 254, 255);
  doc.roundedRect(12, finalY, 186, 26, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RAMOS_COLORS.blue);
  doc.text('CONFERÊNCIA DE EMBALAGEM / VOLUMES (PREENCHIMENTO MANUAL NA CARGA/DESCARGA)', 16, finalY + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total de Itens na Lista: ${order.items.length} produto(s) | Qtd Total de Peças: ${totalQuantity} unid.`, 16, finalY + 12);
  doc.text('1. VOLUMES DESPACHADOS (EXPEDIÇÃO CENTRAL): [ ____________ ] VOLUMES (Caixa / Fardo / Palete)', 16, finalY + 18);
  doc.text('2. VOLUMES RECEBIDOS (FILIAL DESTINO):             [ ____________ ] VOLUMES (Conferido na entrega)', 16, finalY + 23);

  // Signatures
  let sigY = finalY + 32;

  if (sigY > 235) {
    doc.addPage();
    sigY = 43;
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

  // Apply brand header, logo, 1cm bands, and page numbers to all pages
  applyBrandHeaderFooterToAllPages(
    doc,
    'ROMANEIO DE ENTREGA & GUIA DE TRANSPORTE',
    'Controle de Saída, Despacho e Transferência entre Filiais',
    orderIdText,
    companyLogo,
    `STATUS: ${order.status.toUpperCase()}`,
    '* Romaneio interno de transferência de mercadorias. Isento de valor fiscal.'
  );

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

  const cardY = 43;

  const docIdFontSize = getFittingFontSize(doc, docIdText, 52, 8, 6);
  doc.setFontSize(docIdFontSize);
  const splitDocId = doc.splitTextToSize(docIdText, 52);

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

  const supplierName = supplier?.name || 'Não informado';
  const supFontSize = getFittingFontSize(doc, supplierName, 55, 8, 6.5);
  doc.setFontSize(supFontSize);
  const splitSupplierName = doc.splitTextToSize(supplierName, 55);

  const cnpjText = supplier?.cnpj || 'Não cadastrado';
  const contactText = supplier?.contact || 'Não cadastrado';

  const leftReqH = 10 + (splitDocId.length * 5) + 12;
  const rightReqH = 10 + (splitSupplierName.length * 5) + 12;
  const cardHeight = Math.max(28, leftReqH, rightReqH);

  // Backgrounds
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, cardY, 90, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, cardY, 90, cardHeight, 1.5, 1.5, 'FD');

  // Left Text
  let leftY = cardY + 5.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DA ORDEM DE COMPRA', 16, leftY);
  leftY += 5.5;

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Nº da Ordem:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(docIdFontSize);
  doc.text(splitDocId, 45, leftY);
  leftY += Math.max(1, splitDocId.length) * 5;

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data de Emissão:', 16, leftY);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(orderDate, 45, leftY);
  leftY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação Atual:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...RAMOS_COLORS.orange);
  doc.text(order.status.toUpperCase(), 45, leftY, { maxWidth: 52 });

  // Right Text
  let rightY = cardY + 5.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DO FORNECEDOR', 112, rightY);
  rightY += 5.5;

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Razão Social:', 112, rightY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(supFontSize);
  doc.text(splitSupplierName, 138, rightY);
  rightY += Math.max(1, splitSupplierName.length) * 5;

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CNPJ:', 112, rightY);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(cnpjText, 138, rightY, { maxWidth: 55 });
  rightY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Contato:', 112, rightY);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(contactText, 138, rightY, { maxWidth: 55 });

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
    startY: cardY + cardHeight + 4,
    margin: { top: 43, bottom: 22, left: 12, right: 12 },
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

  if (finalY > 220) {
    doc.addPage();
    finalY = 43;
  }

  // Totals Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(108, finalY, 90, 16, 1.5, 1.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('VALOR TOTAL DA ORDEM DE COMPRA:', 112, finalY + 6.5);

  doc.setFontSize(11);
  doc.setTextColor(243, 112, 33); // Laranja Ramos highlight
  doc.text(`R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 194, finalY + 12, { align: 'right' });

  // Apply brand header, logo, 1cm bands, and page numbers to all pages
  applyBrandHeaderFooterToAllPages(
    doc,
    'ORDEM DE COMPRA DE MERCADORIAS',
    'Documento de Solicitação de Suprimentos ao Fornecedor',
    docIdText,
    companyLogo,
    `STATUS: ${order.status.toUpperCase()}`,
    'Documento gerado eletronicamente pelo Sistema MOX - Lojas Ramos.'
  );

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

  const cardY = 43;

  const leftTitleText = 'FILIAL SOLICITANTE / DESTINO';
  const leftTitleFontSize = getFittingFontSize(doc, leftTitleText, 82, 10.5, 7.5);

  const branchName = (branch?.name || 'Filial não identificada').toUpperCase();
  const bFontSize = getFittingFontSize(doc, branchName, 82, 11, 7.5);
  doc.setFontSize(bFontSize);
  const splitBranch = doc.splitTextToSize(branchName, 82);

  const mgrText = branch?.manager || 'Não cadastrado';
  const mgrFontSize = getFittingFontSize(doc, mgrText, 52, 8.5, 6.5);
  doc.setFontSize(mgrFontSize);
  const splitMgr = doc.splitTextToSize(mgrText, 52);

  const locText = branch?.location || 'Não cadastrado';
  const locFontSize = getFittingFontSize(doc, locText, 52, 8.5, 6.5);
  doc.setFontSize(locFontSize);
  const splitLoc = doc.splitTextToSize(locText, 52);

  const dateText = isDraft
    ? new Date().toLocaleString('pt-BR')
    : new Date(orderObj?.createdAt || Date.now()).toLocaleString('pt-BR');

  const leftReqH = 13 + (splitBranch.length * 5) + (splitMgr.length * 4.8) + (splitLoc.length * 4.8) + 6;
  const rightReqH = 35;
  const cardHeight = Math.max(35, leftReqH, rightReqH);

  // Card Backgrounds FIRST
  doc.setFillColor(254, 240, 138); // Yellow background
  doc.setDrawColor(234, 179, 8); // Yellow border
  doc.setLineWidth(0.8);
  doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

  // Left Text
  let leftY = cardY + 6.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(leftTitleFontSize);
  doc.setTextColor(0, 0, 0);
  doc.text(leftTitleText, 16, leftY);
  leftY += 6.5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('LOJA / FILIAL:', 16, leftY);
  leftY += 4.5;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(bFontSize);
  doc.setTextColor(0, 0, 0);
  doc.text(splitBranch, 16, leftY);
  leftY += Math.max(1, splitBranch.length) * 5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Gerente Resp.:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(mgrFontSize);
  doc.text(splitMgr, 46, leftY);
  leftY += Math.max(1, splitMgr.length) * 4.8;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Localização:', 16, leftY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(locFontSize);
  doc.text(splitLoc, 46, leftY);

  // Right Text
  let rightY = cardY + 6.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETALHES DA REQUISIÇÃO', 112, rightY);
  rightY += 6.5;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data de Emissão:', 112, rightY);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(dateText, 146, rightY, { maxWidth: 48 });
  rightY += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Prioridade:', 112, rightY);
  doc.setFont('Helvetica', 'bold');
  if (priority === 'urgent' || orderObj?.priority === 'urgent') {
    doc.setTextColor(225, 29, 72);
    doc.text('URGENTE', 146, rightY, { maxWidth: 48 });
  } else {
    doc.setTextColor(...RAMOS_COLORS.orange);
    doc.text('NORMAL', 146, rightY, { maxWidth: 48 });
  }
  rightY += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 112, rightY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const statusLabel = isDraft ? 'Rascunho' : (orderObj?.status?.toUpperCase() || 'SOLICITADO');
  doc.text(statusLabel, 146, rightY, { maxWidth: 48 });

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
    margin: { top: 43, bottom: 22, left: 12, right: 12 },
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

  if (finalY > 210) {
    doc.addPage();
    finalY = 43;
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
  doc.setTextColor(243, 112, 33); // Laranja Ramos highlight
  doc.text(`R$ ${runningTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 192, finalY + 14, { align: 'right' });

  // Apply brand header, logo, 1cm bands, and page numbers to all pages
  applyBrandHeaderFooterToAllPages(
    doc,
    title,
    'Guia Interna de Requisição e Reposição de Estoque de Filial',
    docIdText,
    companyLogo,
    isDraft ? 'RASCUNHO' : `PRIORIDADE: ${priority.toUpperCase()}`,
    'Lojas Ramos Distribuição LTDA. • Abastecimento Interno'
  );

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

    // Always draw top & bottom 1cm Laranja and Azul brand bands on every label page
    drawBrandBands(doc);

    // Outer border frame (Margin frame around A4 sheet, sitting neatly between 1cm bands)
    doc.setDrawColor(...RAMOS_COLORS.blue);
    doc.setLineWidth(1.2);
    doc.rect(8, 12, 194, 273, 'S');

    // Header top bar - Lojas Ramos
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(10, 12, 190, 22, 2, 2, 'FD');

    // Render company logo on left if available
    let logoWidthOffset = 16;
    if (companyLogo) {
      try {
        let format: 'PNG' | 'JPEG' | 'WEBP' = 'PNG';
        if (companyLogo.includes('image/jpeg') || companyLogo.includes('image/jpg')) format = 'JPEG';
        else if (companyLogo.includes('image/webp')) format = 'WEBP';

        doc.addImage(companyLogo, format, 13, 13.5, 22, 19);
        logoWidthOffset = 38;
      } catch (e) {
        console.warn("Could not render logo in label:", e);
      }
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('LOJAS RAMOS - TRANSPORTE E LOGÍSTICA', logoWidthOffset, 21, { maxWidth: 100 });

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`EMISSÃO: ${currentDate}`, 194, 21, { align: 'right', maxWidth: 50 });

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...RAMOS_COLORS.orange);
    doc.text('ETIQUETA DE IDENTIFICAÇÃO DE CAIXA / CARGA', logoWidthOffset, 29, { maxWidth: 100 });

    // Yellow Box - VOLUME NUMBER BADGE (VERY PROMINENT)
    doc.setFillColor(254, 240, 138); // Yellow-200
    doc.setDrawColor(234, 179, 8); // Yellow-600
    doc.setLineWidth(1);
    doc.roundedRect(14, 37, 182, 22, 3, 3, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(161, 98, 7);
    doc.text('VOLUME / CAIXA:', 22, 51, { maxWidth: 70 });

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(`CAIXA ${i} DE ${totalLabels}`, 188, 52, { align: 'right', maxWidth: 90 });

    // BIG HIGHLIGHTED BOX: CIDADE & FILIAL DESTINO
    doc.setFillColor(254, 240, 138); // Amarelo
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(1.2);
    doc.roundedRect(14, 62, 182, 68, 4, 4, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text('▶ CIDADE DESTINO DA CARGA:', 20, 72, { maxWidth: 170 });

    // GIANT CITY NAME
    doc.setFont('Helvetica', 'bold');
    let cityFontSize = 26;
    if (cityName.length > 15) cityFontSize = 20;
    if (cityName.length > 25) cityFontSize = 16;
    doc.setFontSize(cityFontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(cityName, 20, 84, { maxWidth: 170 });

    // Divider inside destination box
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.line(20, 88, 190, 88);

    doc.setFontSize(10.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('▶ FILIAL RECEBEDORA / UNIDADE:', 20, 96, { maxWidth: 170 });

    // GIANT BRANCH NAME
    doc.setFont('Helvetica', 'bold');
    let bNameFontSize = 20;
    if (branchName.length > 20) bNameFontSize = 16;
    if (branchName.length > 30) bNameFontSize = 13;
    doc.setFontSize(bNameFontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(branchName, 20, 106, { maxWidth: 170 });

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`Endereço/Local: ${branchLocation}`, 20, 116, { maxWidth: 170 });
    doc.text(`Gerente Responsável: ${branchManager}`, 20, 123, { maxWidth: 170 });

    // ORDER IDENTIFICATION CARD
    doc.setFillColor(224, 242, 254); // Light sky blue
    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(1);
    doc.roundedRect(14, 134, 182, 58, 4, 4, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...RAMOS_COLORS.blue);
    doc.text('▶ CÓDIGO DO PEDIDO / SOLICITAÇÃO:', 20, 145, { maxWidth: 170 });

    // GIANT ORDER ID
    doc.setFont('Helvetica', 'bold');
    let orderIdFontSize = 28;
    if (orderIdText.length > 15) orderIdFontSize = 22;
    if (orderIdText.length > 22) orderIdFontSize = 18;
    doc.setFontSize(orderIdFontSize);
    doc.setTextColor(15, 23, 42);
    doc.text(orderIdText, 20, 160, { maxWidth: 170 });

    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.6);
    doc.line(20, 166, 190, 166);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('ORIGEM DA CARGA: CENTRO DE DISTRIBUIÇÃO CENTRAL - LOJAS RAMOS', 20, 175, { maxWidth: 170 });
    doc.text(`STATUS DO PEDIDO: EMBALADO E SEPARADO PARA EMBARQUE`, 20, 183, { maxWidth: 170 });

    // BARCODE BOX
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, 196, 182, 48, 3, 3, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text('CÓDIGO DE RASTREABILIDADE INTERNA (LOGÍSTICA REVERSA E DISTRIBUIÇÃO):', 20, 205);

    // Simulated Barcode Lines
    let lineX = 22;
    const barWidths = [2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2];
    for (let b = 0; b < barWidths.length && lineX < 184; b++) {
      const w = barWidths[b];
      doc.setFillColor(15, 23, 42);
      doc.rect(lineX, 209, w, 20, 'F');
      lineX += w + (b % 2 === 0 ? 2 : 1);
    }

    doc.setFont('Courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`* ${orderIdText} - VOL-${i}/${totalLabels} *`, 100, 238, { align: 'center' });

    // FOOTER WARNING BOX
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, 248, 182, 25, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28);
    doc.text('⚠ ATENÇÃO MOTORISTA / TRANSPORTE & CONFERÊNCIA:', 20, 255);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(127, 29, 29);
    doc.text('1. Esta etiqueta deve permanecer visível na parte externa da caixa durante todo o transporte.', 20, 261);
    doc.text('2. A filial recebedora deve conferir as quantidades com a nota de romaneio no momento do descarregamento.', 20, 267);
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
      'TERMO DE RECEBIMENTO E RESPONSABILIDADE DE EPI',
      'Controle de Entrega de Equipamentos de Proteção Individual',
      `DIST-${distId}`,
      companyLogo,
      'EPI / SEGURANÇA'
    );

    let yPos = 43;

    // Info Box (Sucursal & Beneficiario)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, yPos, 186, 22, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('EMPRESA / SUCURSAL:', 16, yPos + 6, { maxWidth: 88 });
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Lojas Ramos - ${branch?.name || 'Sucursal'}`, 16, yPos + 12, { maxWidth: 88 });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(branch?.location || '', 16, yPos + 17, { maxWidth: 88 });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('BENEFICIÁRIO / RECEBEDOR ÚNICO:', 110, yPos + 6, { maxWidth: 84 });
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text(recipientName, 110, yPos + 12, { maxWidth: 84 });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Data: ${new Date(distribution.createdAt).toLocaleDateString('pt-BR')}`, 110, yPos + 17, { maxWidth: 84 });

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
      margin: { top: 43, bottom: 22, left: 12, right: 12 },
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
    doc.setTextColor(6, 78, 59);
    doc.text(splitDecl, 15, yPos + 6);

    yPos += boxHeight + 20;

    // Signature Block
    if (yPos > 235) {
      doc.addPage();
      yPos = 43;
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

  // Apply brand headers, logo, 1cm bands, and page numbers to all pages
  applyBrandHeaderFooterToAllPages(
    doc,
    'TERMO DE RECEBIMENTO E RESPONSABILIDADE DE EPI',
    'Controle de Entrega de Equipamentos de Proteção Individual',
    `DIST-${distId}`,
    companyLogo,
    'EPI / SEGURANÇA',
    'Termo de Responsabilidade de EPI • Lojas Ramos'
  );

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

    const cardY = 43;

    const leftTitleText = 'DADOS DA EXPEDIÇÃO / ORIGEM';
    const leftTitleFontSize = getFittingFontSize(doc, leftTitleText, 82, 9.5, 7.5);

    const distIdText = `#${distId}`;
    const idFontSize = getFittingFontSize(doc, distIdText, 50, 8.5, 6.5);
    doc.setFontSize(idFontSize);
    const splitDistId = doc.splitTextToSize(distIdText, 50);

    const distDate = distribution.createdAt ? new Date(distribution.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    const rightTitleText = 'DESTINATÁRIO / FILIAL DESTINO';
    const rightTitleFontSize = getFittingFontSize(doc, rightTitleText, 82, 10.5, 7.5);

    const branchName = (branch?.name || 'Filial não identificada').toUpperCase();
    const bFontSize = getFittingFontSize(doc, branchName, 82, 11, 7.5);
    doc.setFontSize(bFontSize);
    const splitBranch = doc.splitTextToSize(branchName, 82);

    const locText = branch?.location || 'Não cadastrada';
    const locFontSize = getFittingFontSize(doc, locText, 48, 8.5, 6.5);
    doc.setFontSize(locFontSize);
    const splitLoc = doc.splitTextToSize(locText, 48);

    const recipientFontSize = getFittingFontSize(doc, recipientName, 48, 8.5, 6.5);
    doc.setFontSize(recipientFontSize);
    const splitRecipient = doc.splitTextToSize(recipientName, 48);

    const leftReqH = 13 + (splitDistId.length * 5) + 18;
    const rightReqH = 13 + (splitBranch.length * 5) + (splitLoc.length * 4.8) + (splitRecipient.length * 4.8) + 6;
    const cardHeight = Math.max(35, leftReqH, rightReqH);

    // Card Backgrounds
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

    doc.setFillColor(254, 240, 138); // Yellow background
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

    // Left Text
    let leftY = cardY + 6.5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(leftTitleFontSize);
    doc.setTextColor(15, 23, 42);
    doc.text(leftTitleText, 16, leftY);
    leftY += 6.5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Protocolo ID:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(idFontSize);
    doc.text(splitDistId, 48, leftY);
    leftY += Math.max(1, splitDistId.length) * 5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Data Envio:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(distDate, 48, leftY, { maxWidth: 50 });
    leftY += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Origem Carga:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Centro de Distribuição Central', 48, leftY, { maxWidth: 50 });
    leftY += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Tipo Lançamento:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(distribution.type === 'epi' ? 'Distribuição de EPIs' : 'Distribuição Geral', 48, leftY, { maxWidth: 50 });

    // Right Text
    let rightY = cardY + 6.5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(rightTitleFontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(rightTitleText, 112, rightY);
    rightY += 6.5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('FILIAL DESTINO:', 112, rightY);
    rightY += 4.5;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(bFontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(splitBranch, 112, rightY);
    rightY += Math.max(1, splitBranch.length) * 5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Endereço / Local:', 112, rightY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(locFontSize);
    doc.text(splitLoc, 145, rightY);
    rightY += Math.max(1, splitLoc.length) * 4.8;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Gerente / Recebedor:', 112, rightY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(recipientFontSize);
    doc.text(splitRecipient, 145, rightY);

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
      margin: { top: 43, bottom: 22, left: 12, right: 12 },
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
    if (yPos > 235) {
      doc.addPage();
      yPos = 43;
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

  // Apply brand header, logo, 1cm bands, and page numbers to all pages
  applyBrandHeaderFooterToAllPages(
    doc,
    'ROMANEIO DE ENVIO & GUIA DE TRANSPORTE',
    'Despacho de Mercadorias e Transferência em Lote entre Filiais',
    `#${distId}`,
    companyLogo,
    distribution.type === 'epi' ? 'TIPO: EPIs' : 'TIPO: MERCADORIAS',
    'Romaneio de Distribuição • Lojas Ramos'
  );

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

    const cardY = 43;

    const leftTitleText = 'DADOS DO REGISTRO DE DISTRIBUIÇÃO';
    const leftTitleFontSize = getFittingFontSize(doc, leftTitleText, 82, 9.5, 7.5);

    const distIdText = `#${distId}`;
    const idFontSize = getFittingFontSize(doc, distIdText, 50, 8.5, 6.5);
    doc.setFontSize(idFontSize);
    const splitDistId = doc.splitTextToSize(distIdText, 50);

    const distDate = distribution.createdAt ? new Date(distribution.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    const rightTitleText = 'FILIAL RECEBEDORA';
    const rightTitleFontSize = getFittingFontSize(doc, rightTitleText, 82, 10.5, 7.5);

    const branchName = (branch?.name || 'Filial não identificada').toUpperCase();
    const bFontSize = getFittingFontSize(doc, branchName, 82, 11, 7.5);
    doc.setFontSize(bFontSize);
    const splitBranch = doc.splitTextToSize(branchName, 82);

    const locText = branch?.location || 'Não cadastrada';
    const locFontSize = getFittingFontSize(doc, locText, 48, 8.5, 6.5);
    doc.setFontSize(locFontSize);
    const splitLoc = doc.splitTextToSize(locText, 48);

    const recipientFontSize = getFittingFontSize(doc, recipientName, 48, 8.5, 6.5);
    doc.setFontSize(recipientFontSize);
    const splitRecipient = doc.splitTextToSize(recipientName, 48);

    const leftReqH = 13 + (splitDistId.length * 5) + 18;
    const rightReqH = 13 + (splitBranch.length * 5) + (splitLoc.length * 4.8) + (splitRecipient.length * 4.8) + 6;
    const cardHeight = Math.max(35, leftReqH, rightReqH);

    // Card Backgrounds
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, cardY, 90, cardHeight, 2, 2, 'FD');

    doc.setFillColor(236, 253, 245); // Emerald light background
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.roundedRect(108, cardY, 90, cardHeight, 2, 2, 'FD');

    // Left Text
    let leftY = cardY + 6.5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(leftTitleFontSize);
    doc.setTextColor(15, 23, 42);
    doc.text(leftTitleText, 16, leftY);
    leftY += 6.5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Protocolo ID:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(idFontSize);
    doc.text(splitDistId, 48, leftY);
    leftY += Math.max(1, splitDistId.length) * 5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Data Lançamento:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(distDate, 48, leftY, { maxWidth: 50 });
    leftY += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Origem Remetente:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Almoxarifado / Estoque Central', 48, leftY, { maxWidth: 50 });
    leftY += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Modalidade:', 16, leftY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(distribution.type === 'epi' ? 'Termo EPI com Assinatura' : 'Comprovante Padrão de Entrega', 48, leftY, { maxWidth: 50 });

    // Right Text
    let rightY = cardY + 6.5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(rightTitleFontSize);
    doc.setTextColor(6, 95, 70);
    doc.text(rightTitleText, 112, rightY);
    rightY += 6.5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('NOME DA SUCURSAL:', 112, rightY);
    rightY += 4.5;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(bFontSize);
    doc.setTextColor(6, 95, 70);
    doc.text(splitBranch, 112, rightY);
    rightY += Math.max(1, splitBranch.length) * 5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Endereço / Local:', 112, rightY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(locFontSize);
    doc.text(splitLoc, 145, rightY);
    rightY += Math.max(1, splitLoc.length) * 4.8;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Gerente Responsável:', 112, rightY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(recipientFontSize);
    doc.text(splitRecipient, 145, rightY);

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
      margin: { top: 43, bottom: 22, left: 12, right: 12 },
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
    if (yPos > 235) {
      doc.addPage();
      yPos = 43;
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

  // Apply brand header, logo, 1cm bands, and page numbers to all pages
  applyBrandHeaderFooterToAllPages(
    doc,
    'COMPROVANTE DE ENTREGA & TERMO DE RECEBIMENTO',
    'Confirmação de Recebimento de Mercadorias e Transferência Interna',
    `#${distId}`,
    companyLogo,
    'RECEBIMENTO FILIAL',
    'Comprovante de Entrega de Filial • Lojas Ramos'
  );

  const fileName = selectedBranchId && selectedBranchId !== 'all'
    ? `comprovante_filial_ramos_${selectedBranchId}_dist_${distId}.pdf`
    : `comprovantes_filial_ramos_dist_${distId}.pdf`;

  doc.save(fileName);
}

/**
 * FOLHA DE SEPARAÇÃO MANUAL (PICKING)
 * Formato compacto com Checkpoint [  ] por produto, nome da cidade em destaque e densidade para vários itens.
 */
export function generateManualPickingPDF(
  orderInput: BranchOrder | BranchOrder[],
  branchInput: Branch | undefined,
  products: Product[],
  approverName: string,
  companyLogo?: string,
  cityNameOverride?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const orders = Array.isArray(orderInput) ? orderInput : [orderInput];
  const firstOrder = orders[0];

  const cityRaw = cityNameOverride || branchInput?.location || firstOrder?.branchId || 'N/A';
  const city = cityRaw.split('-')[0].trim() || cityRaw;
  const fullLocation = branchInput?.location || cityRaw;

  const orderIdText = orders.length === 1 
    ? `#${firstOrder.id.toUpperCase()}` 
    : `LOTE DE ${orders.length} PEDIDOS`;

  addHeaderWithLogo(
    doc,
    'FOLHA DE SEPARAÇÃO MANUAL (PICKING)',
    'Conferência Física de Estoque e Seleção de Itens no Galpão/CD',
    orderIdText,
    companyLogo,
    `CIDADE: ${city.toUpperCase()}`
  );

  // Compact Header / Info Card (height 22mm for high item capacity)
  const cardY = 41;
  const cardHeight = 22;

  // Outer Card Background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, cardY, 186, cardHeight, 1.5, 1.5, 'FD');

  // Highlight Box for City and Branch Destination (Warm Amber Box)
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, cardY + 2, 85, cardHeight - 4, 1, 1, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('CIDADE / MUNICÍPIO DESTINO:', 17, cardY + 6.5);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${city.toUpperCase()}`, 17, cardY + 11.5);

  const branchLabel = branchInput?.name 
    ? `FILIAL: ${branchInput.name.toUpperCase()} (${fullLocation})`
    : `DESTINO: ${fullLocation}`;

  doc.setFontSize(7);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(branchLabel, 17, cardY + 16.5, { maxWidth: 80 });

  // Right Side Info
  const rightX = 104;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`SOLICITAÇÃO: ${orderIdText}`, rightX, cardY + 6.5);

  const orderDate = firstOrder?.createdAt 
    ? new Date(firstOrder.createdAt).toLocaleString('pt-BR') 
    : new Date().toLocaleString('pt-BR');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Data Solicitação: ${orderDate}`, rightX, cardY + 11.5);

  const approver = firstOrder?.approvedBy || approverName || 'Administrador Central';
  doc.text(`Aprovado Por: ${approver}`, rightX, cardY + 16.5);

  // Aggregate items from orders
  const itemMap = new Map<string, number>();
  let totalPieces = 0;

  orders.forEach(ord => {
    if (ord && ord.items) {
      ord.items.forEach(it => {
        const current = itemMap.get(it.productId) || 0;
        itemMap.set(it.productId, current + it.quantity);
        totalPieces += it.quantity;
      });
    }
  });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Peças: ${totalPieces} un | Variedade: ${itemMap.size} item(ns)`, 150, cardY + 6.5);

  // Build Table Rows with CHECKPOINT column first
  const tableData: any[][] = [];
  let seq = 1;

  itemMap.forEach((qty, productId) => {
    const product = products.find(p => p.id === productId);
    const code = product?.code || 'N/A';
    const name = product?.name || 'Produto Não Encontrado';
    const category = product?.category || 'Geral';
    const unit = product?.unit || 'un';

    tableData.push([
      '[   ]', // Checkpoint column
      seq++,
      code,
      name,
      category,
      unit,
      qty,
      '[ _______ ]'
    ]);
  });

  // Render Compact AutoTable
  autoTable(doc, {
    startY: cardY + cardHeight + 3,
    margin: { top: 41, bottom: 18, left: 12, right: 12 },
    head: [['CHECK', 'Nº', 'Código', 'Descrição do Produto', 'Categoria', 'Un', 'Qtd Pedida', 'Conferido']],
    body: tableData,
    theme: 'grid',
    styles: {
      cellPadding: 1.5, // Ultra-compact row spacing so many products fit on 1 sheet
      fontSize: 8,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [30, 41, 59], // Dark slate header
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2
    },
    bodyStyles: {
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [217, 119, 6] }, // [   ] Checkpoint
      1: { cellWidth: 10, halign: 'center', textColor: [100, 116, 139] },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 'auto', fontStyle: 'bold' },
      4: { cellWidth: 28 },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      7: { cellWidth: 24, halign: 'center', textColor: [100, 116, 139] }
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 4;

  if (finalY > 260) {
    doc.addPage();
    finalY = 41;
  }

  // Footer Conference Box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, finalY, 186, 16, 1, 1, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CONFERÊNCIA DE SEPARAÇÃO NO ESTOQUE (ALMOXARIFADO / CD):', 15, finalY + 5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Separado Por: ___________________________________   Visto Conferência: ________________________   Data: ____/____/2026', 15, finalY + 11);

  applyBrandHeaderFooterToAllPages(
    doc,
    'FOLHA DE SEPARAÇÃO MANUAL (PICKING)',
    'Conferência Física de Estoque no Galpão',
    orderIdText,
    companyLogo,
    `CIDADE: ${city.toUpperCase()}`,
    '* Documento de Separação Interna CD • Lojas Ramos.'
  );

  const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = orders.length === 1 
    ? `separacao_manual_${firstOrder.id.toLowerCase()}_${cleanCity}.pdf`
    : `separacao_lote_${cleanCity}.pdf`;

  doc.save(filename);
}
