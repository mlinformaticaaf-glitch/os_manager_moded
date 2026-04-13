export interface CompanySettings {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  warranty_terms: string | null;
  footer_message: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_beneficiary: string | null;
  onboarding_completed: boolean;
  os_initial_number: number;
  os_next_number: number;
  created_at: string;
  updated_at: string;
}

export type CompanySettingsInsert = Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>;
export type CompanySettingsUpdate = Partial<Omit<CompanySettingsInsert, 'user_id'>>;
