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
  { value: 'service_order', label: 'Ordem de Serviço' },
  { value: 'purchase', label: 'Compra' },
  { value: 'salary', label: 'Salário' },
  { value: 'rent', label: 'Aluguel' },
  { value: 'utilities', label: 'Contas' },
  { value: 'other', label: 'Outros' },
];

export const TRANSACTION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
];
