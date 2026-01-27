export interface Client {
  id: string;
  user_id: string;
  code: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<Client, 'id' | 'code' | 'created_at' | 'updated_at'>;
export type ClientUpdate = Partial<Omit<ClientInsert, 'user_id'>>;
