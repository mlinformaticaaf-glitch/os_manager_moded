import { Sale, SaleItem, SALE_PAYMENT_METHOD_OPTIONS } from '@/types/sale';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSaleNumber } from '@/lib/saleUtils';

interface PrintData {
  sale: Sale;
  items: SaleItem[];
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyDocument?: string;
  logoUrl?: string;
  footerMessage?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getPaymentMethodLabel = (method: string | null) => {
  if (!method) return '-';
  const option = SALE_PAYMENT_METHOD_OPTIONS.find(o => o.value === method);
  return option ? option.label : method;
};

function generateA4Body({ sale, items, companyName = 'Sistema de Vendas', companyPhone, companyAddress, companyEmail, companyDocument, logoUrl, footerMessage = 'Obrigado pela preferência!' }: PrintData, copyLabel?: string) {
  return `
      <div class="sale-copy">
        ${copyLabel ? `<div style="text-align: right; font-size: 8px; font-weight: bold; color: #888; margin-bottom: 4px;">${copyLabel}</div>` : ''}
        <div class="header">
          <div class="company-info" style="display: flex; align-items: center; gap: 12px;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 60px; max-width: 120px; object-fit: contain;" crossorigin="anonymous" />` : ''}
            <div>
              <h1>${companyName}</h1>
              ${companyDocument ? `<p>${companyDocument}</p>` : ''}
              ${companyPhone ? `<p>📞 ${companyPhone}</p>` : ''}
              ${companyEmail ? `<p>✉️ ${companyEmail}</p>` : ''}
              ${companyAddress ? `<p>📍 ${companyAddress}</p>` : ''}
            </div>
          </div>
          <div class="sale-info">
            <div class="sale-number">VENDA ${formatSaleNumber(sale.sale_number, sale.created_at)}</div>
            <div class="sale-date">${format(new Date(sale.sale_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
          </div>
        </div>

        ${sale.client ? `
          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="info-grid">
              <div class="info-item">
                <label>Nome</label>
                <span>${sale.client.name}</span>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Itens da Venda</div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th class="right">Qtd</th>
                <th class="right">Unit.</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.unit_price)}</td>
                  <td class="right">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="bottom-section">
          <div class="signatures">
            <div class="signature-line">
              <hr />
              <span>Assinatura do Cliente</span>
            </div>
          </div>
          <div class="totals-table">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="totals-row discount">
                <span>Desconto:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
            ` : ''}
            ${sale.shipping > 0 ? `
              <div class="totals-row">
                <span>Frete:</span>
                <span>+${formatCurrency(sale.shipping)}</span>
              </div>
            ` : ''}
            <div class="totals-row total">
              <span>TOTAL:</span>
              <span>${formatCurrency(sale.total)}</span>
            </div>
            <div class="payment-info">
              Pagamento: ${getPaymentMethodLabel(sale.payment_method)}
            </div>
          </div>
        </div>

        ${footerMessage ? `
          <div style="text-align: center; margin-top: 24px; font-size: 10px; color: #666;">
            ${footerMessage}
          </div>
        ` : ''}
      </div>
  `;
}

function generateA4Styles() {
  return `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #333;
          padding: 15mm;
          max-width: 210mm;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #333;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        
        .company-info h1 {
          font-size: 18px;
          margin-bottom: 3px;
        }
        
        .company-info p {
          font-size: 10px;
          color: #555;
        }
        
        .sale-info {
          text-align: right;
        }
        
        .sale-number {
          font-size: 16px;
          font-weight: bold;
          color: #2563eb;
        }
        
        .sale-date {
          font-size: 10px;
          color: #666;
          margin-top: 3px;
        }
        
        .section {
          margin-bottom: 15px;
        }
        
        .section-title {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #666;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        
        .info-item label {
          font-size: 8px;
          color: #888;
          text-transform: uppercase;
          display: block;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        th {
          background: #f1f5f9;
          padding: 6px 8px;
          text-align: left;
          font-size: 8px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 1px solid #ddd;
        }
        
        td {
          padding: 5px 8px;
          border-bottom: 1px solid #eee;
        }
        
        .right {
          text-align: right;
        }
        
        .bottom-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 40px;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        
        .totals-table {
          min-width: 220px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 10px;
        }
        
        .totals-row.total {
          font-size: 14px;
          font-weight: bold;
          border-top: 1px solid #333;
          padding-top: 5px;
          margin-top: 3px;
          color: #2563eb;
        }
        
        .totals-row.discount {
          color: #dc2626;
        }
        
        .payment-info {
          font-size: 9px;
          color: #666;
          margin-top: 6px;
          text-align: right;
        }

        .signatures {
          flex: 1;
          margin-bottom: 10px;
        }
        
        .signature-line {
          text-align: center;
          max-width: 250px;
        }
        
        .signature-line hr {
          border: none;
          border-top: 1px solid #333;
          margin-bottom: 4px;
        }
        
        .signature-line span {
          font-size: 8px;
          color: #666;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
  `;
}

export function printSaleA4(data: PrintData) {
  const body = generateA4Body(data);
  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Venda ${formatSaleNumber(data.sale.sale_number, data.sale.created_at)}</title>
      <style>${generateA4Styles()}</style>
    </head>
    <body onload="window.print(); window.close();">
      ${body}
    </body>
    </html>
  `;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
  }
}

export function printSaleThermal({ sale, items, companyName = 'Sistema de Vendas', companyPhone, footerMessage = 'Obrigado pela preferência!' }: PrintData) {
  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Venda ${formatSaleNumber(sale.sale_number, sale.created_at)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: 58mm auto;
          margin: 2mm;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.3;
          width: 54mm;
          color: #000;
        }
        
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .double-divider { border-top: 2px solid #000; margin: 6px 0; }
        
        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 14px; margin-bottom: 2px; }
        
        .sale-number {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin: 8px 0;
        }
        
        .info-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .info-row .label { font-weight: bold; }
        
        .item-row { margin: 4px 0; }
        .item-details { display: flex; justify-content: space-between; font-size: 9px; }
        
        .total-section { margin-top: 8px; }
        .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row.grand-total { font-size: 14px; font-weight: bold; margin-top: 4px; }
        
        .footer { text-align: center; margin-top: 15px; font-size: 9px; }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <h1>${companyName}</h1>
        ${companyPhone ? `<p>${companyPhone}</p>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div class="sale-number">CPV: ${formatSaleNumber(sale.sale_number, sale.created_at).split('/')[0]}</div>
      
      <div class="info-row">
        <span>DATA:</span>
        <span>${format(new Date(sale.sale_date), "dd/MM/yy HH:mm")}</span>
      </div>
      
      ${sale.client ? `
        <div class="info-row">
          <span>CLI:</span>
          <span>${sale.client.name.substring(0, 15)}</span>
        </div>
      ` : ''}
      
      <div class="double-divider"></div>
      
      <div>
        ${items.map(item => `
          <div class="item-row">
            <div>${item.product_name}</div>
            <div class="item-details">
              <span>${item.quantity} x ${formatCurrency(item.unit_price).replace('R$', '')}</span>
              <span>${formatCurrency(item.total).replace('R$', '')}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="double-divider"></div>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(sale.subtotal)}</span>
        </div>
        ${sale.discount > 0 ? `
          <div class="total-row">
            <span>Desconto:</span>
            <span>-${formatCurrency(sale.discount)}</span>
          </div>
        ` : ''}
        ${sale.shipping > 0 ? `
          <div class="total-row">
            <span>Frete:</span>
            <span>+${formatCurrency(sale.shipping)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-row">
        <span>PAG:</span>
        <span>${getPaymentMethodLabel(sale.payment_method)}</span>
      </div>
      
      <div class="footer">
        <p>${footerMessage}</p>
        <p>${format(new Date(), "dd/MM/yyyy HH:mm:ss")}</p>
      </div>
      
      <div style="margin-top: 20px;">.</div>
    </body>
    </html>
  `;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
  }
}
