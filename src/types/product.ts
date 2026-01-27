export interface Product {
  id: string;
  user_id: string;
  code: number | null;
  name: string;
  description: string | null;
  category: string | null;
  cost_price: number;
  sale_price: number;
  profit_margin: number;
  stock_quantity: number;
  min_stock: number;
  unit: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<Product, 'id' | 'code' | 'profit_margin' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<Omit<ProductInsert, 'user_id'>>;

export const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade' },
  { value: 'pç', label: 'Peça' },
  { value: 'cx', label: 'Caixa' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'm', label: 'Metro' },
  { value: 'lt', label: 'Litro' },
];

export const formatProductCode = (code: number | null): string => {
  if (code === null) return '';
  return `PROD-${code}`;
};
