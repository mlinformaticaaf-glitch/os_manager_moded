import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialTransactionWithClient } from '@/hooks/useFinancialTransactions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptData {
  transaction: FinancialTransactionWithClient;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyDocument?: string;
  logoUrl?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export async function printFinancialReceipt({
  transaction,
  companyName = 'Minha Empresa',
  companyPhone,
  companyAddress,
  companyEmail,
  companyDocument,
  logoUrl,
}: ReceiptData) {
  const doc = new jsPDF();
  const today = new Date();
  const dateStr = format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const transactionDate = transaction.paid_date || transaction.due_date || transaction.created_at;
  const formattedTransactionDate = format(new Date(transactionDate), "dd/MM/yyyy", { locale: ptBR });

  // Configurações de cores
  const primaryColor = [37, 99, 235]; // #2563eb

  let yPos = 30;
  const leftMargin = 20;

  // Título e logo
  if (logoUrl) {
    try {
      const img = await loadImage(logoUrl);
      // Mantém proporção da imagem
      const maxWidth = 40;
      const maxHeight = 30;
      let imgWidth = img.width;
      let imgHeight = img.height;
      
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      imgWidth *= ratio;
      imgHeight *= ratio;

      doc.addImage(img, 'PNG', leftMargin, 15, imgWidth, imgHeight);
      yPos = 15 + imgHeight + 10;
    } catch (error) {
      console.error('Error loading logo:', error);
      yPos = 30;
    }
  }

  // Cabeçalho da Empresa
  doc.setFontSize(22);
  doc.setTextColor(33, 33, 33);
  doc.text(companyName, 20, yPos);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  yPos += 8;
  if (companyDocument) {
    doc.text(companyDocument, 20, yPos);
    yPos += 5;
  }
  if (companyPhone) {
    doc.text(`Tel: ${companyPhone}`, 20, yPos);
    yPos += 5;
  }
  if (companyEmail) {
    doc.text(companyEmail, 20, yPos);
    yPos += 5;
  }
  if (companyAddress) {
    doc.text(companyAddress, 20, yPos);
  }

  // Bloco de Título "RECIBO"
  doc.setFontSize(28);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RECIBO', 140, 35);

  // Valor
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(140, 42, 50, 15, 2, 2, 'F');
  doc.setFontSize(14);
  doc.setTextColor(33, 33, 33);
  doc.text(`VALOR: ${formatCurrency(transaction.amount)}`, 145, 52);

  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos + 10, 190, yPos + 10);
  
  const contentY = yPos + 25;

  // Conteúdo do Recibo
  doc.setFontSize(14);
  doc.setTextColor(33, 33, 33);
  const clientName = transaction.client_name || '__________________________________________';
  const receiptText = `Recebemos de ${clientName} a importância de ${formatCurrency(transaction.amount)} referente a ${transaction.description}.`;
  
  const splitText = doc.splitTextToSize(receiptText, 170);
  doc.text(splitText, 20, contentY);

  // Detalhes em tabela
  autoTable(doc, {
    startY: contentY + 20,
    head: [['Detalhes da Transação', '']],
    body: [
      ['Data da Transação', formattedTransactionDate],
      ['Forma de Pagamento', transaction.payment_method || '-'],
      ['Categoria', transaction.category],
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 20, right: 20 }
  });

  // Rodapé
  const footerY = 220; // Ajustado para baixo
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const city = companyAddress?.split(',')[0] || '';
  doc.text(`${city}, ${dateStr}`, 105, footerY, { align: 'center' });

  // Área de Assinatura
  doc.setDrawColor(33, 33, 33);
  doc.line(70, footerY + 30, 140, footerY + 30);
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text(companyName, 105, footerY + 38, { align: 'center' });

  // Salvar/Abrir PDF
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  
  // Opcional: Limpar o URL após um tempo para liberar memória
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
