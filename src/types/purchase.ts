export interface Purchase {
  id: string;
  user_id: string;
  supplier_id: string | null;
  purchase_number: number;
  invoice_number: string | null;
  purchase_date: string;
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
  supplier?: {
    id: string;
    name: string;
  } | null;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export type PurchaseInsert = Omit<Purchase, 'id' | 'purchase_number' | 'created_at' | 'updated_at' | 'supplier' | 'items'>;
export type PurchaseUpdate = Partial<Omit<PurchaseInsert, 'user_id'>>;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'partial', label: 'Parcial' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cash', label: 'Dinheiro' },
];
