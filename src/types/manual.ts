
export interface Manual {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface ManualStep {
    id: string;
    manual_id: string;
    step_order: number;
    title: string | null;
    description: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateManualInput = Omit<Manual, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
export type CreateManualStepInput = Omit<ManualStep, 'id' | 'created_at' | 'updated_at' | 'manual_id' | 'step_order'>;
