import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Company, Profile } from '@/types/saas';

export function useSaaS() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Query to get the current user's profile and company
    const profileQuery = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*, companies(*)')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const company = profileQuery.data?.companies as Company | undefined;
    const profile = profileQuery.data as Profile | undefined;

    // Mutation to create/initialize a company
    const createCompany = useMutation({
        mutationFn: async ({ name, cnpj }: { name: string; cnpj?: string }) => {
            if (!user?.id) throw new Error('Usuário não autenticado');

            // 1. Create the company
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert({
                    name,
                    cnpj,
                    owner_id: user.id,
                    subscription_status: 'trialing'
                })
                .select()
                .single();

            if (companyError) throw companyError;

            // 2. Update the user's profile with the company_id
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ company_id: newCompany.id })
                .eq('id', user.id);

            if (profileError) throw profileError;

            return newCompany;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast({
                title: 'Empresa configurada',
                description: 'Sua empresa foi criada com sucesso.',
            });
        },
    });

    // Mutation to update company data
    const updateCompany = useMutation({
        mutationFn: async (updates: Partial<Pick<Company, 'name' | 'cnpj' | 'logo_url'>>) => {
            if (!company?.id) throw new Error('Empresa não encontrada');

            const { data, error } = await supabase
                .from('companies')
                .update(updates)
                .eq('id', company.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast({
                title: 'Dados atualizados',
                description: 'As informações da empresa foram gravadas.',
            });
        },
    });



    return {
        company,
        profile,
        isLoading: profileQuery.isLoading,
        createCompany,
        updateCompany
    };
}
