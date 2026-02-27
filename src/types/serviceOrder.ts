import { Client } from './client';

// Default statuses - custom ones are stored in the database as strings
export type OSDefaultStatus = 'pending' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'completed' | 'delivered' | 'cancelled';
// OSStatus now accepts any string to support custom statuses
export type OSStatus = string;
export type OSPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface ServiceOrder {
  id: string;
  user_id: string;
  client_id: string | null;
  equipment_id: string | null;
  order_number: number;
  status: OSStatus;
  priority: OSPriority;
  equipment: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  accessories: string | null;
  device_password: string | null;
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
  client?: { id: string; name: string; phone: string | null; email: string | null } | null;
  equipment_ref?: { id: string; code: number | null; description: string } | null;
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

export const DEFAULT_STATUSES: OSDefaultStatus[] = [
  'pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'completed', 'delivered', 'cancelled'
];

export const STATUS_CONFIG: Record<OSDefaultStatus, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', shortLabel: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  in_progress: { label: 'Em Andamento', shortLabel: 'Andamento', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  waiting_parts: { label: 'Aguard. Peças', shortLabel: 'Ag. Peças', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  waiting_approval: { label: 'Aguard. Aprovação', shortLabel: 'Ag. Aprov.', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  completed: { label: 'Concluída', shortLabel: 'Concluída', color: 'text-green-700', bgColor: 'bg-green-100' },
  delivered: { label: 'Faturado e Entregue', shortLabel: 'Entregue', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Cancelada', shortLabel: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const PRIORITY_CONFIG: Record<OSPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-600' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high: { label: 'Alta', color: 'text-orange-600' },
  urgent: { label: 'Urgente', color: 'text-red-600' },
};

// Available color options for custom statuses
export const CUSTOM_STATUS_COLORS = [
  { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Amarelo' },
  { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Azul' },
  { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Laranja' },
  { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Roxo' },
  { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Verde' },
  { color: 'text-emerald-700', bgColor: 'bg-emerald-100', label: 'Esmeralda' },
  { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Vermelho' },
  { color: 'text-pink-700', bgColor: 'bg-pink-100', label: 'Rosa' },
  { color: 'text-cyan-700', bgColor: 'bg-cyan-100', label: 'Ciano' },
  { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Cinza' },
  { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Índigo' },
  { color: 'text-teal-700', bgColor: 'bg-teal-100', label: 'Teal' },
];
