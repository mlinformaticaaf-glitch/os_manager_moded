import { PurchaseItem } from './purchase';

export interface Sale {
    id: string;
    user_id: string;
    client_id: string | null;
    sale_number: number;
    sale_date: string;
    due_date: string | null;
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    payment_status: string;
    payment_method: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Joined data
    client?: {
        id: string;
        name: string;
        phone: string | null;
    } | null;
    items?: SaleItem[];
}

export interface SaleItem {
    id?: string;
    sale_id?: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export type SaleInsert = Omit<Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at' | 'client' | 'items'>;
export type SaleUpdate = Partial<Omit<SaleInsert, 'user_id'>>;

export const SALE_PAYMENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Pago' },
    { value: 'partial', label: 'Parcial' },
    { value: 'cancelled', label: 'Cancelado' },
];

export const SALE_PAYMENT_METHOD_OPTIONS = [
    { value: 'pix', label: 'PIX' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'bank_transfer', label: 'Transferência Bancária' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cash', label: 'Dinheiro' },
];
