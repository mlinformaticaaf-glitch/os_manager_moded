import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Equipment, EquipmentInsert, EquipmentUpdate } from '@/types/equipment';

export function useEquipment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const equipmentQuery = useQuery({
    queryKey: ['equipment', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id)
        .order('code', { ascending: true });

      if (error) throw error;
      return data as Equipment[];
    },
    enabled: !!user?.id,
  });

  const createEquipment = useMutation({
    mutationFn: async (equipment: Omit<EquipmentInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('equipment')
        .insert({
          ...equipment,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Equipamento criado',
        description: 'O equipamento foi cadastrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEquipment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EquipmentUpdate }) => {
      const { data: updated, error } = await supabase
        .from('equipment')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Equipamento atualizado',
        description: 'O equipamento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Equipamento excluído',
        description: 'O equipamento foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir equipamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    equipment: equipmentQuery.data ?? [],
    isLoading: equipmentQuery.isLoading,
    error: equipmentQuery.error,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
}
