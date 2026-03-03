import { Sale, SaleItem, SALE_PAYMENT_METHOD_OPTIONS } from '@/types/sale';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSaleNumber } from '@/lib/saleUtils';

interface WhatsAppSaleData {
    sale: Sale;
    items: SaleItem[];
    companyName?: string;
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

export function formatSaleWhatsAppMessage({ sale, items, companyName = 'Sistema de Vendas', footerMessage = 'Obrigado pela preferência!' }: WhatsAppSaleData): string {
    let message = `*${companyName}*\n`;
    message += `------------------------\n\n`;

    message += `*COMPROVANTE DE VENDA #${formatSaleNumber(sale.sale_number, sale.created_at)}*\n`;
    message += `Data: ${format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}\n\n`;

    if (sale.client) {
        message += `*Cliente:*\n`;
        message += `${sale.client.name}\n\n`;
    }

    message += `*Itens:*\n`;
    items.forEach(item => {
        message += `- ${item.quantity}x ${item.product_name} @ ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total)}\n`;
    });
    message += '\n';

    message += `------------------------\n`;
    message += `Subtotal: ${formatCurrency(sale.subtotal)}\n`;
    if (sale.discount > 0) {
        message += `Desconto: -${formatCurrency(sale.discount)}\n`;
    }
    if (sale.shipping > 0) {
        message += `Frete: +${formatCurrency(sale.shipping)}\n`;
    }
    message += `\n*TOTAL: ${formatCurrency(sale.total)}* \n`;

    if (sale.payment_method) {
        message += `Pagamento: ${getPaymentMethodLabel(sale.payment_method)}\n`;
    }

    message += `\n------------------------\n`;
    message += footerMessage;

    return message;
}

export function cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '55' + cleaned;
    }
    return cleaned;
}

export function openSaleWhatsApp(phone: string, message: string) {
    try {
        const cleanedPhone = cleanPhoneNumber(phone);
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening WhatsApp:', error);
    }
}
