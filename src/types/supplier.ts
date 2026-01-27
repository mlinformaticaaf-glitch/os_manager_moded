export interface Supplier {
  id: string;
  user_id: string;
  code: number | null;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type SupplierInsert = Omit<Supplier, 'id' | 'code' | 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<Omit<SupplierInsert, 'user_id'>>;
