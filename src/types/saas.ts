export interface Company {
    id: string;
    name: string;
    cnpj: string | null;
    logo_url: string | null;
    owner_id: string;
    subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
    stripe_customer_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    company_id: string | null;
    full_name: string | null;
    role: 'admin' | 'editor' | 'viewer';
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    company_id: string;
    status: string;
    plan_type: string;
    current_period_start: string | null;
    current_period_end: string | null;
    stripe_subscription_id: string | null;
    created_at: string;
    updated_at: string;
}
