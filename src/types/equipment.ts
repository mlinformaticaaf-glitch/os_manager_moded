export interface Equipment {
  id: string;
  user_id: string;
  code: number | null;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type EquipmentInsert = Omit<Equipment, 'id' | 'code' | 'created_at' | 'updated_at'>;
export type EquipmentUpdate = Partial<Omit<EquipmentInsert, 'user_id'>>;

export const formatEquipmentCode = (code: number | null): string => {
  if (code === null) return '';
  return `EQP-${code}`;
};
