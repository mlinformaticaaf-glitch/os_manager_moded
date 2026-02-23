import { ServiceOrder, ServiceOrderItem, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/serviceOrder';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatOSNumber } from '@/lib/osUtils';

interface PrintData {
  order: ServiceOrder;
  items: ServiceOrderItem[];
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyDocument?: string;
  logoUrl?: string;
  warrantyTerms?: string;
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
  const methods: Record<string, string> = {
    pix: 'PIX',
    cash: 'Dinheiro',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    promissory: 'Promissória',
  };
  return methods[method] || method;
};

export function printOSA4({ order, items, companyName = 'Assistência Técnica', companyPhone, companyAddress, warrantyTerms, footerMessage = 'Obrigado pela preferência!' }: PrintData) {
  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');

  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>OS ${formatOSNumber(order.order_number, order.created_at)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 8mm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 9px;
          line-height: 1.2;
          color: #333;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #333;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        
        .company-info h1 {
          font-size: 14px;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        
        .company-info p {
          color: #666;
          font-size: 8px;
        }
        
        .os-info {
          text-align: right;
        }
        
        .os-number {
          font-size: 16px;
          font-weight: bold;
          color: #2563eb;
        }
        
        .os-date {
          font-size: 8px;
          color: #666;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: bold;
          margin-top: 3px;
        }
        
        .section {
          margin-bottom: 6px;
        }
        
        .section-title {
          font-size: 10px;
          font-weight: bold;
          color: #1a1a1a;
          border-bottom: 1px solid #ddd;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
        }
        
        .info-item label {
          display: block;
          font-size: 7px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 1px;
        }
        
        .info-item span {
          font-weight: 500;
          font-size: 9px;
        }
        
        .equipment-box {
          background: #f5f5f5;
          padding: 6px;
          border-radius: 3px;
          margin-bottom: 6px;
        }
        
        .equipment-title {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .equipment-details {
          display: flex;
          gap: 12px;
          font-size: 8px;
          color: #666;
        }
        
        .description-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .problem-box, .diagnosis-box, .solution-box {
          padding: 6px;
          font-size: 8px;
        }
        
        .problem-box {
          background: #fef3c7;
          border-left: 2px solid #f59e0b;
        }
        
        .diagnosis-box {
          background: #f3e8ff;
          border-left: 2px solid #9333ea;
        }
        
        .solution-box {
          background: #d1fae5;
          border-left: 2px solid #10b981;
        }
        
        .problem-box strong, .diagnosis-box strong, .solution-box strong {
          font-size: 8px;
          display: block;
          margin-bottom: 2px;
        }
        
        .problem-box p, .diagnosis-box p, .solution-box p {
          margin: 0;
          line-height: 1.2;
        }
        
        .items-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 3px 4px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          font-size: 8px;
        }
        
        th {
          background: #f5f5f5;
          font-size: 7px;
          text-transform: uppercase;
          color: #666;
        }
        
        td.right, th.right {
          text-align: right;
        }
        
        .bottom-section {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 15px;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #333;
        }
        
        .totals-table {
          width: 100%;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 9px;
        }
        
        .totals-row.discount {
          color: #dc2626;
        }
        
        .totals-row.total {
          font-size: 12px;
          font-weight: bold;
          border-top: 1px solid #333;
          margin-top: 4px;
          padding-top: 4px;
        }
        
        .payment-info {
          font-size: 8px;
          color: #666;
        }
        
        .warranty-notice {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 3px;
          padding: 6px;
          font-size: 8px;
          margin-bottom: 6px;
        }
        
        .warranty-notice strong {
          color: #1d4ed8;
        }
        
        .signatures {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
        }
        
        .signature-line {
          text-align: center;
          width: 150px;
        }
        
        .signature-line hr {
          border: none;
          border-top: 1px solid #333;
          margin-bottom: 3px;
        }
        
        .signature-line span {
          font-size: 7px;
          color: #666;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${companyName}</h1>
          ${companyPhone ? `<p>📞 ${companyPhone}</p>` : ''}
          ${companyAddress ? `<p>📍 ${companyAddress}</p>` : ''}
        </div>
        <div class="os-info">
          <div class="os-number">OS ${formatOSNumber(order.order_number, order.created_at)}</div>
          <div class="os-date">${format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
          <div class="status-badge" style="background: ${STATUS_CONFIG[order.status].bgColor}; color: ${STATUS_CONFIG[order.status].color.replace('text-', '')}">
            ${STATUS_CONFIG[order.status].label}
          </div>
        </div>
      </div>

      ${order.client ? `
        <div class="section">
          <div class="section-title">Cliente</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Nome</label>
              <span>${order.client.name}</span>
            </div>
            <div class="info-item">
              <label>Telefone</label>
              <span>${order.client.phone || '-'}</span>
            </div>
            <div class="info-item">
              <label>E-mail</label>
              <span>${order.client.email || '-'}</span>
            </div>
          </div>
        </div>
      ` : ''}

      ${order.equipment ? `
        <div class="section">
          <div class="section-title">Equipamento</div>
          <div class="equipment-box">
            <div class="equipment-title">${order.equipment}${order.brand ? ` - ${order.brand}` : ''}${order.model ? ` ${order.model}` : ''}</div>
            <div class="equipment-details">
              ${order.serial_number ? `<span>S/N: ${order.serial_number}</span>` : ''}
              ${order.accessories ? `<span>Acessórios: ${order.accessories}</span>` : ''}
            </div>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Descrição do Serviço</div>
        <div class="description-grid">
          <div class="problem-box">
            <strong>Problema Relatado:</strong>
            <p>${order.reported_issue}</p>
          </div>
          ${order.diagnosis || order.solution ? `
            <div>
              ${order.diagnosis ? `
                <div class="diagnosis-box" style="margin-bottom: ${order.solution ? '4px' : '0'}">
                  <strong>Diagnóstico:</strong>
                  <p>${order.diagnosis}</p>
                </div>
              ` : ''}
              ${order.solution ? `
                <div class="solution-box">
                  <strong>Solução:</strong>
                  <p>${order.solution}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      ${(services.length > 0 || products.length > 0) ? `
        <div class="section">
          <div class="section-title">Itens</div>
          <div class="items-grid">
            ${services.length > 0 ? `
              <div>
                <strong style="font-size: 8px; color: #666;">SERVIÇOS</strong>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th class="right">Qtd</th>
                      <th class="right">Unit.</th>
                      <th class="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${services.map(s => {
                      const itemTotal = s.quantity * s.unit_price;
                      return `
                      <tr>
                        <td>${s.description}</td>
                        <td class="right">${s.quantity}</td>
                        <td class="right">${formatCurrency(s.unit_price)}</td>
                        <td class="right">${formatCurrency(itemTotal)}</td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
            ${products.length > 0 ? `
              <div>
                <strong style="font-size: 8px; color: #666;">PRODUTOS / PEÇAS</strong>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th class="right">Qtd</th>
                      <th class="right">Unit.</th>
                      <th class="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${products.map(p => {
                      const itemTotal = p.quantity * p.unit_price;
                      return `
                      <tr>
                        <td>${p.description}</td>
                        <td class="right">${p.quantity}</td>
                        <td class="right">${formatCurrency(p.unit_price)}</td>
                        <td class="right">${formatCurrency(itemTotal)}</td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div class="bottom-section">
        <div>
          ${order.warranty_until ? `
            <div class="warranty-notice">
              <strong>⚠️ Garantia até ${format(new Date(order.warranty_until), "dd/MM/yyyy", { locale: ptBR })}</strong>
              ${warrantyTerms ? `<p style="margin-top: 4px;">${warrantyTerms}</p>` : '- Cobre defeitos de serviço. Não se aplica a mau uso, quedas ou danos por terceiros.'}
            </div>
          ` : ''}
          <div class="signatures">
            <div class="signature-line">
              <hr />
              <span>Técnico</span>
            </div>
            <div class="signature-line">
              <hr />
              <span>Cliente</span>
            </div>
          </div>
        </div>
        <div class="totals-table">
          <div class="totals-row">
            <span>Serviços:</span>
            <span>${formatCurrency(order.total_services)}</span>
          </div>
          <div class="totals-row">
            <span>Produtos:</span>
            <span>${formatCurrency(order.total_products)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="totals-row discount">
              <span>Desconto:</span>
              <span>-${formatCurrency(order.discount)}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>TOTAL:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
          <div class="payment-info">
            Pagamento: ${getPaymentMethodLabel(order.payment_method)}
          </div>
        </div>
      </div>

      ${footerMessage ? `
        <div style="text-align: center; margin-top: 12px; font-size: 9px; color: #666;">
          ${footerMessage}
        </div>
      ` : ''}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function printOSThermal({ order, items, companyName = 'Assistência Técnica', companyPhone, warrantyTerms, footerMessage = 'Obrigado pela preferência!' }: PrintData) {
  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');

  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>OS ${formatOSNumber(order.order_number, order.created_at)}</title>
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
        
        .center {
          text-align: center;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        
        .double-divider {
          border-top: 2px solid #000;
          margin: 6px 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 8px;
        }
        
        .header h1 {
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .header .phone {
          font-size: 9px;
        }
        
        .os-number {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin: 8px 0;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        .info-row .label {
          font-weight: bold;
        }
        
        .section-title {
          font-weight: bold;
          margin-top: 8px;
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 9px;
        }
        
        .item-row {
          margin: 2px 0;
        }
        
        .item-name {
          font-size: 9px;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          padding-left: 8px;
        }
        
        .total-section {
          margin-top: 8px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        .total-row.grand-total {
          font-size: 14px;
          font-weight: bold;
          margin-top: 4px;
        }
        
        .footer {
          margin-top: 12px;
          text-align: center;
          font-size: 8px;
        }
        
        .signature-area {
          margin-top: 20px;
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #000;
          width: 80%;
          margin: 0 auto 4px;
        }
        
        @media print {
          body {
            width: 54mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        ${companyPhone ? `<div class="phone">${companyPhone}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div class="os-number">OS ${formatOSNumber(order.order_number, order.created_at)}</div>
      <div class="center" style="font-size: 9px;">
        ${format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </div>

      <div class="divider"></div>

      ${order.client ? `
        <div class="info-row">
          <span class="label">Cliente:</span>
        </div>
        <div style="font-size: 11px; font-weight: bold;">${order.client.name}</div>
        ${order.client.phone ? `<div style="font-size: 9px;">Tel: ${order.client.phone}</div>` : ''}
      ` : ''}

      ${order.equipment ? `
        <div class="divider"></div>
        <div class="section-title">Equipamento</div>
        <div style="font-size: 10px;">${order.equipment}${order.brand ? ` ${order.brand}` : ''}${order.model ? ` ${order.model}` : ''}</div>
        ${order.serial_number ? `<div style="font-size: 8px;">S/N: ${order.serial_number}</div>` : ''}
      ` : ''}

      <div class="divider"></div>
      <div class="section-title">Problema</div>
      <div style="font-size: 9px;">${order.reported_issue.substring(0, 150)}${order.reported_issue.length > 150 ? '...' : ''}</div>

      ${order.solution ? `
        <div class="divider"></div>
        <div class="section-title">Solução</div>
        <div style="font-size: 9px;">${order.solution.substring(0, 150)}${order.solution.length > 150 ? '...' : ''}</div>
      ` : ''}

      ${services.length > 0 ? `
        <div class="divider"></div>
        <div class="section-title">Serviços</div>
        ${services.map(s => {
          const itemTotal = s.quantity * s.unit_price;
          return `
          <div class="item-row">
            <div class="item-name">${s.quantity}x ${s.description.substring(0, 22)}${s.description.length > 22 ? '...' : ''}</div>
            <div class="item-details">
              <span>@ ${formatCurrency(s.unit_price)}</span>
              <span>${formatCurrency(itemTotal)}</span>
            </div>
          </div>
        `}).join('')}
      ` : ''}

      ${products.length > 0 ? `
        <div class="divider"></div>
        <div class="section-title">Produtos</div>
        ${products.map(p => {
          const itemTotal = p.quantity * p.unit_price;
          return `
          <div class="item-row">
            <div class="item-name">${p.quantity}x ${p.description.substring(0, 22)}${p.description.length > 22 ? '...' : ''}</div>
            <div class="item-details">
              <span>@ ${formatCurrency(p.unit_price)}</span>
              <span>${formatCurrency(itemTotal)}</span>
            </div>
          </div>
        `}).join('')}
      ` : ''}

      <div class="double-divider"></div>

      <div class="total-section">
        <div class="total-row">
          <span>Serviços:</span>
          <span>${formatCurrency(order.total_services)}</span>
        </div>
        <div class="total-row">
          <span>Produtos:</span>
          <span>${formatCurrency(order.total_products)}</span>
        </div>
        ${order.discount > 0 ? `
          <div class="total-row">
            <span>Desconto:</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
        <div class="total-row" style="font-size: 9px;">
          <span>Pagamento:</span>
          <span>${getPaymentMethodLabel(order.payment_method)}</span>
        </div>
      </div>

      ${order.warranty_until ? `
        <div class="divider"></div>
        <div style="font-size: 8px; text-align: center;">
          Garantia até: ${format(new Date(order.warranty_until), "dd/MM/yyyy", { locale: ptBR })}
          ${warrantyTerms ? `<br>${warrantyTerms}` : ''}
        </div>
      ` : ''}

      <div class="signature-area">
        <div class="divider"></div>
        <div style="margin-top: 20px;"></div>
        <div class="signature-line"></div>
        <div style="font-size: 8px;">Assinatura do Cliente</div>
      </div>

      <div class="footer">
        <div class="divider"></div>
        ${footerMessage}
        <br>
        ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
