import { ServiceOrder, ServiceOrderItem, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/serviceOrder';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatOSNumber } from '@/lib/osUtils';
import jsPDF from 'jspdf';

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

function generateA4Body({ order, items, companyName = 'Assistência Técnica', companyPhone, companyAddress, companyEmail, companyDocument, logoUrl, warrantyTerms, footerMessage = 'Obrigado pela preferência!' }: PrintData, copyLabel?: string) {
  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');

  return `
      <div class="os-copy">
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
          <div class="os-info">
            <div class="os-number">OS ${formatOSNumber(order.order_number, order.created_at)}</div>
            <div class="os-date">${format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
            <div class="status-badge" style="background: ${(STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || { bgColor: 'bg-gray-100' }).bgColor}; color: ${(STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || { color: 'text-gray-700' }).color.replace('text-', '')}">
              ${(STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || { label: order.status }).label}
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
            ${(order.warranty_until || warrantyTerms) ? `
              <div class="warranty-notice">
                ${order.warranty_until ? `<strong>⚠️ Garantia até ${format(new Date(order.warranty_until), "dd/MM/yyyy", { locale: ptBR })}</strong>` : ''}
                ${warrantyTerms ? `<p style="margin-top: ${order.warranty_until ? '4px' : '0'};">${warrantyTerms}</p>` : (order.warranty_until ? '<p style="margin-top: 4px;">- Cobre defeitos de serviço. Não se aplica a mau uso, quedas ou danos por terceiros.</p>' : '')}
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
          font-size: 10px;
          color: #333;
          padding: 15mm;
          max-width: 210mm;
          margin: 0 auto;
        }

        .os-copy {
          page-break-after: auto;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #333;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .company-info h1 {
          font-size: 16px;
          margin-bottom: 2px;
        }
        
        .company-info p {
          font-size: 9px;
          color: #555;
        }
        
        .os-info {
          text-align: right;
        }
        
        .os-number {
          font-size: 14px;
          font-weight: bold;
          color: #2563eb;
        }
        
        .os-date {
          font-size: 9px;
          color: #666;
          margin-top: 2px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: bold;
          margin-top: 4px;
        }
        
        .section {
          margin-bottom: 10px;
        }
        
        .section-title {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          color: #666;
          border-bottom: 1px solid #ddd;
          padding-bottom: 3px;
          margin-bottom: 6px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        
        .info-item label {
          font-size: 7px;
          color: #888;
          text-transform: uppercase;
          display: block;
        }
        
        .info-item span {
          font-size: 10px;
        }
        
        .equipment-box {
          background: #f8f9fa;
          padding: 6px;
          border-radius: 4px;
        }
        
        .equipment-title {
          font-weight: bold;
          font-size: 11px;
        }
        
        .equipment-details {
          display: flex;
          gap: 12px;
          font-size: 9px;
          color: #666;
          margin-top: 3px;
        }
        
        .description-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .problem-box, .diagnosis-box, .solution-box {
          padding: 6px;
          border-radius: 4px;
          font-size: 9px;
        }
        
        .problem-box {
          background: #fef2f2;
        }
        
        .diagnosis-box {
          background: #eff6ff;
        }
        
        .solution-box {
          background: #f0fdf4;
        }
        
        .items-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin-top: 4px;
        }
        
        th {
          background: #f1f5f9;
          padding: 4px 6px;
          text-align: left;
          font-size: 7px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 1px solid #ddd;
        }
        
        td {
          padding: 3px 6px;
          border-bottom: 1px solid #eee;
        }
        
        .right {
          text-align: right;
        }
        
        .bottom-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
        }
        
        .totals-table {
          min-width: 200px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 9px;
        }
        
        .totals-row.total {
          font-size: 12px;
          font-weight: bold;
          border-top: 1px solid #333;
          padding-top: 4px;
          margin-top: 2px;
          color: #2563eb;
        }
        
        .totals-row.discount {
          color: #dc2626;
        }
        
        .payment-info {
          font-size: 8px;
          color: #666;
          margin-top: 4px;
          text-align: right;
        }
        
        .warranty-notice {
          background: #fffbeb;
          border: 1px solid #f59e0b;
          border-radius: 4px;
          padding: 6px;
          font-size: 8px;
          margin-bottom: 8px;
        }
        
        .signatures {
          display: flex;
          gap: 40px;
          margin-top: 20px;
        }
        
        .signature-line {
          flex: 1;
          text-align: center;
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
  `;
}

const buildA4DocumentContent = (data: PrintData) => {
  const body = generateA4Body(data);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>OS ${formatOSNumber(data.order.order_number, data.order.created_at)}</title>
      <style>${generateA4Styles()}</style>
    </head>
    <body>
      ${body}
    </body>
    </html>
  `;
};

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

async function generateOSA4PdfBlob(data: PrintData): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.background = '#fff';
  container.innerHTML = buildA4DocumentContent(data);
  document.body.appendChild(container);

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await doc.html(container, {
      margin: [5, 5, 5, 5],
      autoPaging: 'text',
      html2canvas: {
        scale: 0.55,
        useCORS: true,
      },
      width: 200,
      windowWidth: container.scrollWidth,
    });

    return doc.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

export async function shareOSA4PDF(data: PrintData) {
  const pdfBlob = await generateOSA4PdfBlob(data);
  const orderId = sanitizeFileName(formatOSNumber(data.order.order_number, data.order.created_at));
  const fileName = `OS_${orderId}.pdf`;

  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({
      title: `Ordem de Servico ${formatOSNumber(data.order.order_number, data.order.created_at)}`,
      text: `OS ${formatOSNumber(data.order.order_number, data.order.created_at)}`,
      files: [file],
    });
    return;
  }

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function promptShareBeforePrintOSA4(data: PrintData) {
  const wantsToShare = window.confirm('Deseja compartilhar o PDF da OS antes de imprimir?');

  if (wantsToShare) {
    try {
      await shareOSA4PDF(data);
    } catch (error) {
      console.error('Erro ao compartilhar PDF da OS:', error);
      window.alert('Nao foi possivel compartilhar o PDF. A impressao continuara normalmente.');
    }
  }

  printOSA4(data);
}

export function printOSA4(data: PrintData) {
  const content = buildA4DocumentContent(data);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function printOSA4Dual(data: PrintData) {
  const copy1 = generateA4Body(data, '1ª Via - Estabelecimento');
  const copy2 = generateA4Body(data, '2ª Via - Cliente');

  const content = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>OS ${formatOSNumber(data.order.order_number, data.order.created_at)} - 2 Vias</title>
      <style>
        ${generateA4Styles()}

        body {
          padding: 8mm 12mm;
        }

        .os-copy {
          page-break-after: auto;
          font-size: 8px;
        }

        .os-copy .header {
          margin-bottom: 6px;
          padding-bottom: 4px;
        }

        .os-copy .company-info h1 {
          font-size: 12px;
        }

        .os-copy .company-info p {
          font-size: 7px;
        }

        .os-copy .os-number {
          font-size: 11px;
        }

        .os-copy .os-date {
          font-size: 7px;
        }

        .os-copy .status-badge {
          font-size: 7px;
          padding: 1px 6px;
        }

        .os-copy .section {
          margin-bottom: 5px;
        }

        .os-copy .section-title {
          font-size: 7px;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }

        .os-copy .info-item label {
          font-size: 6px;
        }

        .os-copy .info-item span {
          font-size: 8px;
        }

        .os-copy .equipment-box {
          padding: 4px;
        }

        .os-copy .equipment-title {
          font-size: 9px;
        }

        .os-copy .equipment-details {
          font-size: 7px;
          margin-top: 2px;
        }

        .os-copy .problem-box,
        .os-copy .diagnosis-box,
        .os-copy .solution-box {
          padding: 4px;
          font-size: 7px;
        }

        .os-copy table {
          font-size: 7px;
        }

        .os-copy th {
          font-size: 6px;
          padding: 2px 4px;
        }

        .os-copy td {
          padding: 2px 4px;
        }

        .os-copy .bottom-section {
          margin-top: 6px;
          padding-top: 4px;
        }

        .os-copy .totals-row {
          font-size: 7px;
        }

        .os-copy .totals-row.total {
          font-size: 10px;
        }

        .os-copy .payment-info {
          font-size: 7px;
        }

        .os-copy .warranty-notice {
          padding: 4px;
          font-size: 7px;
        }

        .os-copy .signatures {
          margin-top: 10px;
          gap: 20px;
        }

        .os-copy .signature-line span {
          font-size: 6px;
        }

        .os-copy img {
          max-height: 40px !important;
          max-width: 80px !important;
        }

        .dual-divider {
          border: none;
          border-top: 1px dashed #999;
          margin: 8px 0;
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
      ${copy1}
      <hr class="dual-divider" />
      ${copy2}
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

      ${(order.warranty_until || warrantyTerms) ? `
        <div class="divider"></div>
        <div style="font-size: 8px; text-align: center;">
          ${order.warranty_until ? `Garantia até: ${format(new Date(order.warranty_until), "dd/MM/yyyy", { locale: ptBR })}` : ''}
          ${warrantyTerms ? `${order.warranty_until ? '<br>' : ''}${warrantyTerms}` : ''}
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
