import { Client } from './client';

export type OSStatus = 'pending' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'completed' | 'delivered' | 'cancelled';
export type OSPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface ServiceOrder {
  id: string;
  user_id: string;
  client_id: string | null;
  order_number: number;
  status: OSStatus;
  priority: OSPriority;
  equipment: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  accessories: string | null;
  reported_issue: string;
  diagnosis: string | null;
  solution: string | null;
  internal_notes: string | null;
  warranty_until: string | null;
  estimated_completion: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  total_services: number;
  total_products: number;
  discount: number;
  total: number;
  payment_method: string | null;
  payment_status: PaymentStatus | null;
  stock_deducted: boolean;
  created_at: string;
  updated_at: string;
  // Joined data - partial client for listing
  client?: { id: string; name: string; phone: string | null; email: string | null } | null;
  items?: ServiceOrderItem[];
}

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  type: 'product' | 'service';
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export type ServiceOrderInsert = Omit<ServiceOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'client' | 'items'>;
export type ServiceOrderUpdate = Partial<ServiceOrderInsert>;

export const STATUS_CONFIG: Record<OSStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  in_progress: { label: 'Em Andamento', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  waiting_parts: { label: 'Aguard. Peças', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  waiting_approval: { label: 'Aguard. Aprovação', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  completed: { label: 'Concluída', color: 'text-green-700', bgColor: 'bg-green-100' },
  delivered: { label: 'Entregue', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const PRIORITY_CONFIG: Record<OSPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-600' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high: { label: 'Alta', color: 'text-orange-600' },
  urgent: { label: 'Urgente', color: 'text-red-600' },
};
