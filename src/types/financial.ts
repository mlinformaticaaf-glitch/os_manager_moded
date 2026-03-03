export interface FinancialTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string;
  reference_id: string | null;
  description: string;
  amount: number;
  due_date: string | null;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  payment_method: string | null;
  notes: string | null;
  recurring: boolean;
  recurring_period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  installments: number;
  created_at: string;
  updated_at: string;
}

export type FinancialTransactionInsert = Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>;
export type FinancialTransactionUpdate = Partial<Omit<FinancialTransactionInsert, 'user_id'>>;

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'income', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
];

export const TRANSACTION_CATEGORY_OPTIONS = [
  { value: 'service_order', label: 'Ordem de Serviço (Entrada)', type: 'income' },
  { value: 'services', label: 'Serviços (Entrada)', type: 'income' },
  { value: 'sales', label: 'Vendas (Entrada)', type: 'income' },
  { value: 'purchase', label: 'Compra (Saída)', type: 'expense' },
  { value: 'expenses', label: 'Despesas (Saída)', type: 'expense' },
  { value: 'withdrawals', label: 'Retiradas (Saída)', type: 'expense' },
  { value: 'other', label: 'Outros', type: 'both' },
];

export const TRANSACTION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
];
