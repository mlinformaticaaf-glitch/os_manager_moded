import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialTransactionWithClient } from '@/hooks/useFinancialTransactions';

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

export function printFinancialReceipt({
  transaction,
  companyName = 'Minha Empresa',
  companyPhone,
  companyAddress,
  companyEmail,
  companyDocument,
  logoUrl,
}: ReceiptData) {
  const today = new Date();
  const dateStr = format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const transactionDate = transaction.paid_date || transaction.due_date || transaction.created_at;
  const formattedTransactionDate = format(new Date(transactionDate), "dd/MM/yyyy", { locale: ptBR });

  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Recibo de Pagamento - ${transaction.description}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          padding: 20mm;
          color: #333;
          line-height: 1.6;
        }
        .receipt-container {
          border: 2px solid #333;
          padding: 30px;
          max-width: 800px;
          margin: 0 auto;
          position: relative;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info h1 { font-size: 24px; margin-bottom: 5px; }
        .company-info p { font-size: 14px; color: #666; }
        .receipt-title {
          text-align: right;
        }
        .receipt-title h2 { font-size: 28px; text-transform: uppercase; color: #2563eb; }
        .receipt-number { font-size: 16px; font-weight: bold; margin-top: 5px; }

        .content { margin-bottom: 40px; }
        .receipt-text {
          font-size: 18px;
          text-align: justify;
          margin-bottom: 30px;
        }
        .value-box {
          background: #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          display: inline-block;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 30px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .detail-item label {
          display: block;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .detail-item span { font-size: 16px; font-weight: 500; }

        .footer {
          margin-top: 60px;
          text-align: center;
        }
        .signature-area {
          margin: 0 auto;
          width: 300px;
          border-top: 1px solid #333;
          padding-top: 10px;
        }
        .signature-area p { font-size: 14px; font-weight: bold; }
        .date { margin-top: 20px; font-style: italic; color: #666; }

        @media print {
          body { padding: 0; }
          .receipt-container { border: 2px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="company-info" style="display: flex; align-items: center; gap: 20px;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 150px; object-fit: contain;" />` : ''}
            <div>
              <h1>${companyName}</h1>
              ${companyDocument ? `<p>${companyDocument}</p>` : ''}
              ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}
              ${companyEmail ? `<p>${companyEmail}</p>` : ''}
              ${companyAddress ? `<p>${companyAddress}</p>` : ''}
            </div>
          </div>
          <div class="receipt-title">
            <h2>RECIBO</h2>
            <div class="value-box">VALOR: ${formatCurrency(transaction.amount)}</div>
          </div>
        </div>

        <div class="content">
          <p class="receipt-text">
            Recebemos de <strong>${transaction.client_name || '__________________________________________'}</strong> 
            a importância de <strong>${formatCurrency(transaction.amount)}</strong> referente a 
            <strong>${transaction.description}</strong>.
          </p>

          <div class="details-grid">
            <div class="detail-item">
              <label>Data da Transação</label>
              <span>${formattedTransactionDate}</span>
            </div>
            <div class="detail-item">
              <label>Forma de Pagamento</label>
              <span>${transaction.payment_method || '-'}</span>
            </div>
            <div class="detail-item" style="grid-column: span 2;">
              <label>Categoria</label>
              <span>${transaction.category}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="date">${companyAddress?.split(',')[0] || ''}, ${dateStr}</div>
          <div style="margin-top: 40px;">
            <div class="signature-area">
              <p>${companyName}</p>
            </div>
          </div>
        </div>
      </div>
      <script>
        window.onload = () => {
          // window.print();
          // window.onafterprint = () => window.close();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    // Give a tiny bit of time for styles to apply before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
