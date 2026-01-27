import { OSStatus, OSPriority } from '@/types/serviceOrder';

export interface WizardItemData {
  type: 'product' | 'service';
  description: string;
  quantity: number;
  unit_price: number;
  product_id?: string;
}

export interface WizardFormData {
  client_id: string | null;
  equipment_id: string | null;
  status: OSStatus;
  priority: OSPriority;
  serial_number: string;
  accessories: string;
  reported_issue: string;
  diagnosis: string;
  solution: string;
  internal_notes: string;
  estimated_completion: string;
  discount: number;
  payment_method: string | null;
  items: WizardItemData[];
}

export type WizardStep = 
  | 'client'
  | 'equipment'
  | 'problem'
  | 'services'
  | 'summary';

export const WIZARD_STEPS: { id: WizardStep; label: string; description: string }[] = [
  { id: 'client', label: 'Cliente', description: 'Selecione o cliente' },
  { id: 'equipment', label: 'Equipamento', description: 'Informe o equipamento' },
  { id: 'problem', label: 'Problema', description: 'Descreva o problema' },
  { id: 'services', label: 'Serviços', description: 'Adicione serviços e produtos' },
  { id: 'summary', label: 'Resumo', description: 'Revise e finalize' },
];
