export interface Service {
  id: string;
  user_id: string;
  code: string | null;
  sequential_code: number | null;
  name: string;
  description: string | null;
  category: string | null;
  cost_price: number;
  sale_price: number;
  estimated_time: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceInsert = Omit<Service, 'id' | 'sequential_code' | 'created_at' | 'updated_at'>;
export type ServiceUpdate = Partial<Omit<ServiceInsert, 'user_id'>>;
