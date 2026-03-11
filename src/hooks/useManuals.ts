
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Manual, ManualStep, CreateManualInput, CreateManualStepInput } from '@/types/manual';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useManuals() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const manualsQuery = useQuery({
        queryKey: ['manuals'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('manuals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Manual[];
        },
        enabled: !!user,
    });

    const createManual = useMutation({
        mutationFn: async (manual: CreateManualInput & { steps: CreateManualStepInput[] }) => {
            if (!user) throw new Error('Usuário não autenticado');

            const { steps, ...manualData } = manual;

            // Inserir o manual
            const { data: newManual, error: manualError } = await supabase
                .from('manuals')
                .insert({ ...manualData, created_by: user.id })
                .select()
                .single();

            if (manualError) throw manualError;

            // Inserir os passos
            if (steps.length > 0) {
                const stepsWithManualId = steps.map((step, index) => ({
                    ...step,
                    manual_id: newManual.id,
                    step_order: index + 1
                }));

                const { error: stepsError } = await supabase
                    .from('manual_steps')
                    .insert(stepsWithManualId);

                if (stepsError) throw stepsError;
            }

            return newManual;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manuals'] });
            toast({
                title: 'Manual criado',
                description: 'O manual operacional foi criado com sucesso.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao criar manual',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const deleteManual = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('manuals')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manuals'] });
            toast({
                title: 'Manual excluído',
                description: 'O manual operacional foi removido.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao excluir manual',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        manuals: manualsQuery.data ?? [],
        isLoading: manualsQuery.isLoading,
        createManual,
        deleteManual,
    };
}

export function useManualSteps(manualId: string | null) {
    return useQuery({
        queryKey: ['manual-steps', manualId],
        queryFn: async () => {
            if (!manualId) return [];

            const { data, error } = await supabase
                .from('manual_steps')
                .select('*')
                .eq('manual_id', manualId)
                .order('step_order', { ascending: true });

            if (error) throw error;
            return data as ManualStep[];
        },
        enabled: !!manualId,
    });
}
