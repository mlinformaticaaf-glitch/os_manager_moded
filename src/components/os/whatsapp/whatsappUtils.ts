import { ServiceOrder, ServiceOrderItem, STATUS_CONFIG } from '@/types/serviceOrder';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatOSNumber } from '@/lib/osUtils';

interface WhatsAppMessageData {
  order: ServiceOrder;
  items: ServiceOrderItem[];
  companyName?: string;
  footerMessage?: string;
  warrantyTerms?: string;
}

interface WhatsAppStatusData {
  order: ServiceOrder;
  companyName?: string;
}

interface WhatsAppStatusTemplateData {
  order: ServiceOrder;
  statusLabel: string;
  companyName?: string;
}

const STATUS_WHATSAPP_TEMPLATES_BY_LABEL: Record<string, string> = {
  '📋 EM ORÇAMENTO': '📋 EM ORÇAMENTO\n\nSua ordem de serviço está em análise. Entraremos em contato em breve com um orçamento detalhado.',
  '🔧 EM ANDAMENTO': '🔧 EM ANDAMENTO\n\nSeu equipamento está sendo analisado e reparado. Atualizaremos você em breve!',
  '⏳ AGUARD. PEÇAS': '⏳ AGUARDANDO PEÇAS\n\nEstamos aguardando a chegada das peças necessárias para prosseguir com o reparo.',
  '⏸️ AGUARD. APROVAÇÃO': '⏸️ AGUARDANDO APROVAÇÃO\n\nAnalisamos seu equipamento. Por favor, revise o diagnóstico e aprove para prosseguirmos com o reparo.',
  '✅ CONCLUÍDA': '✅ CONCLUÍDA\n\nSeu equipamento está pronto! Por favor, agende a retirada na sua conveniência.',
  '📦 FATURADO E ENTREGUE': '📦 ENTREGUE\n\nSeu equipamento foi entregue com sucesso! Agradecemos a confiança em nossos serviços.',
  '❌ CANCELADA': '❌ CANCELADA\n\nSua ordem de serviço foi cancelada. Se tiver dúvidas, entre em contato conosco.',
};

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

const isNonEmpty = (value: string | null | undefined): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

function getEquipmentSummary(order: ServiceOrder): string | null {
  const primaryEquipment = [order.equipment, order.equipment_ref?.description].find(isNonEmpty);
  const identityParts = [primaryEquipment, order.brand, order.model].filter(isNonEmpty);

  if (identityParts.length === 0) {
    return null;
  }

  const [base, ...rest] = identityParts;
  return rest.length > 0 ? `${base} - ${rest.join(' ')}` : base;
}

function appendEquipmentBlock(message: string, order: ServiceOrder): string {
  const equipmentSummary = getEquipmentSummary(order);

  if (!equipmentSummary) {
    return message;
  }

  let nextMessage = `${message}*Equipamento:*\n${equipmentSummary}\n`;

  if (isNonEmpty(order.serial_number)) {
    nextMessage += `S/N: ${order.serial_number}\n`;
  }

  if (isNonEmpty(order.accessories)) {
    nextMessage += `Acessórios: ${order.accessories}\n`;
  }

  return `${nextMessage}\n`;
}

export function formatWhatsAppMessage({ order, items, companyName = 'Assistência Técnica', footerMessage = 'Obrigado pela preferência!', warrantyTerms }: WhatsAppMessageData): string {
  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');
  const statusLabel = STATUS_CONFIG[order.status]?.label || order.status;

  let message = `*${companyName}*\n`;
  message += `------------------------\n\n`;

  message += `*OS #${formatOSNumber(order.order_number, order.created_at)}*\n`;
  message += `Data: ${format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}\n`;
  message += `Status: ${statusLabel}\n\n`;

  if (order.client) {
    message += `*Cliente:*\n`;
    message += `${order.client.name}\n`;
    if (order.client.phone) message += `Tel: ${order.client.phone}\n`;
    message += `\n`;
  }

  message = appendEquipmentBlock(message, order);

  message += `*Problema Relatado:*\n`;
  message += `${order.reported_issue}\n\n`;

  if (order.diagnosis) {
    message += `*Diagnóstico:*\n`;
    message += `${order.diagnosis}\n\n`;
  }

  if (order.solution) {
    message += `*Solução Aplicada:*\n`;
    message += `${order.solution}\n\n`;
  }

  if (services.length > 0) {
    message += `*Serviços:*\n`;
    services.forEach(s => {
      const itemTotal = s.quantity * s.unit_price;
      message += `- ${s.quantity}x ${s.description} @ ${formatCurrency(s.unit_price)} = ${formatCurrency(itemTotal)}\n`;
    });
    message += '\n';
  }

  if (products.length > 0) {
    message += `*Produtos/Peças:*\n`;
    products.forEach(p => {
      const itemTotal = p.quantity * p.unit_price;
      message += `- ${p.quantity}x ${p.description} @ ${formatCurrency(p.unit_price)} = ${formatCurrency(itemTotal)}\n`;
    });
    message += '\n';
  }

  message += `------------------------\n`;
  message += `Serviços: ${formatCurrency(order.total_services)}\n`;
  message += `Produtos: ${formatCurrency(order.total_products)}\n`;
  if (order.discount > 0) {
    message += `Desconto: -${formatCurrency(order.discount)}\n`;
  }
  message += `\n*TOTAL: ${formatCurrency(order.total)}*\n`;

  if (order.payment_method) {
    message += `Pagamento: ${getPaymentMethodLabel(order.payment_method)}\n`;
  }

  if (order.estimated_completion) {
    message += `\n*Previsão de entrega:* ${format(new Date(order.estimated_completion), "dd/MM/yyyy", { locale: ptBR })}\n`;
  }

  if (order.warranty_until) {
    message += `\n*Garantia até:* ${format(new Date(order.warranty_until), "dd/MM/yyyy", { locale: ptBR })}\n`;
  }
  if (warrantyTerms) {
    if (!order.warranty_until) message += '\n';
    message += `${warrantyTerms}\n`;
  }

  message += `\n------------------------\n`;
  message += footerMessage;

  return message;
}

export function formatWhatsAppStatusUpdate({ order, companyName = 'Assistência Técnica' }: WhatsAppStatusData): string {
  const statusLabel = STATUS_CONFIG[order.status]?.label || order.status;

  let message = `*${companyName}*\n\n`;
  message += `Olá! Informamos que sua OS #${formatOSNumber(order.order_number, order.created_at)} teve uma atualização de status:\n\n`;
  message = appendEquipmentBlock(message, order);
  message += `*Novo Status:* ${statusLabel}\n`;

  if (order.status === 'completed') {
    message += `\nSeu equipamento está pronto para retirada!\n`;
    message += `Valor total: ${formatCurrency(order.total)}\n`;
  } else if (order.status === 'waiting_approval') {
    message += `\nAguardamos sua aprovação para prosseguir com o serviço.\n`;
    if (order.diagnosis) {
      message += `\n*Diagnóstico:*\n${order.diagnosis}\n`;
    }
    message += `\nValor estimado: ${formatCurrency(order.total)}\n`;
  } else if (order.status === 'waiting_parts') {
    message += `\nEstamos aguardando a chegada das peças necessárias.\n`;
  } else if (order.status === 'in_progress') {
    message += `\nSeu equipamento está sendo reparado.\n`;
  } else if (order.status === 'delivered') {
    message += `\nSeu equipamento foi entregue!\n`;
    message += `Agradecemos a preferência!\n`;
  }

  return message;
}

export function formatWhatsAppStatusTemplateMessage({
  order,
  statusLabel,
  companyName = 'Assistência Técnica',
}: WhatsAppStatusTemplateData): string {
  const templateMessage = STATUS_WHATSAPP_TEMPLATES_BY_LABEL[statusLabel.trim().toUpperCase()];

  if (templateMessage) {
    let message = `*${companyName}*\n\n`;
    message += `Olá! A sua OS #${formatOSNumber(order.order_number, order.created_at)} teve atualização de status:\n\n`;
    message += `${templateMessage}`;
    return message;
  }

  return formatWhatsAppStatusUpdate({ order, companyName });
}

export function formatWhatsAppPaymentReminder({ order, companyName = 'Assistência Técnica' }: { order: ServiceOrder; companyName?: string }): string {
  let message = `*${companyName}*\n\n`;
  message += `Olá! Este é um lembrete sobre o pagamento pendente da sua OS #${formatOSNumber(order.order_number, order.created_at)}.\n\n`;
  message = appendEquipmentBlock(message, order);
  message += `*Valor:* ${formatCurrency(order.total)}\n`;

  if (order.payment_method) {
    message += `*Forma de pagamento:* ${getPaymentMethodLabel(order.payment_method)}\n`;
  }

  message += `\nQualquer dúvida, estamos à disposição!`;

  return message;
}

export function cleanPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // Add Brazil country code if not present
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

export function openWhatsApp(phone: string, message: string) {
  try {
    const cleanedPhone = cleanPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
  }
}
