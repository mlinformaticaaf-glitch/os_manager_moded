export interface Boleto {
  id: string;
  user_id: string;
  issuer_name: string;
  amount: number;
  due_date: string;
  barcode: string | null;
  status: 'pending' | 'paid' | 'overdue';
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoletoPayment {
  id: string;
  boleto_id: string;
  paid_date: string;
  amount_paid: number;
  receipt_url: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface BoletoWithPayment extends Boleto {
  payment?: BoletoPayment;
}

export type BoletoStatus = 'pending' | 'paid' | 'overdue';

export const BOLETO_STATUS_LABELS: Record<BoletoStatus, string> = {
  pending: 'Em Aberto',
  paid: 'Pago',
  overdue: 'Vencido',
};

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'other', label: 'Outro' },
];
