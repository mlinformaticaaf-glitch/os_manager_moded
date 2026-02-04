import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Boleto, BoletoPayment, BoletoWithPayment } from '@/types/boleto';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useBoletos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to update overdue status
  const updateOverdueStatus = (boletos: Boleto[]): Boleto[] => {
    const today = new Date().toISOString().split('T')[0];
    return boletos.map(boleto => {
      if (boleto.status === 'pending' && boleto.due_date < today) {
        return { ...boleto, status: 'overdue' as const };
      }
      return boleto;
    });
  };

  const boletosQuery = useQuery({
    queryKey: ['boletos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return updateOverdueStatus(data as Boleto[]);
    },
    enabled: !!user?.id,
  });

  const paymentsQuery = useQuery({
    queryKey: ['boleto_payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boleto_payments')
        .select('*')
        .order('paid_date', { ascending: false });

      if (error) throw error;
      return data as BoletoPayment[];
    },
    enabled: !!user?.id,
  });

  const createBoletoMutation = useMutation({
    mutationFn: async (boleto: Omit<Boleto, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('boletos')
        .insert({ ...boleto, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Boleto cadastrado',
        description: 'O boleto foi cadastrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar boleto',
        description: error.message,
      });
    },
  });

  const updateBoletoMutation = useMutation({
    mutationFn: async ({ id, ...boleto }: Partial<Boleto> & { id: string }) => {
      const { data, error } = await supabase
        .from('boletos')
        .update(boleto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Boleto atualizado',
        description: 'O boleto foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar boleto',
        description: error.message,
      });
    },
  });

  const deleteBoletoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('boletos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Boleto excluído',
        description: 'O boleto foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir boleto',
        description: error.message,
      });
    },
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async ({
      boletoId,
      payment,
    }: {
      boletoId: string;
      payment: Omit<BoletoPayment, 'id' | 'boleto_id' | 'created_at'>;
    }) => {
      // Insert payment record
      const { error: paymentError } = await supabase
        .from('boleto_payments')
        .insert({
          boleto_id: boletoId,
          ...payment,
        });

      if (paymentError) throw paymentError;

      // Update boleto status to paid
      const { error: boletoError } = await supabase
        .from('boletos')
        .update({ status: 'paid' })
        .eq('id', boletoId);

      if (boletoError) throw boletoError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      queryClient.invalidateQueries({ queryKey: ['boleto_payments'] });
      toast({
        title: 'Pagamento registrado',
        description: 'O pagamento foi registrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar pagamento',
        description: error.message,
      });
    },
  });

  // Upload PDF file
  const uploadPdf = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('boletos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('boletos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Upload receipt file
  const uploadReceipt = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('payment-receipts').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Get signed URL for private files
  const getSignedUrl = async (bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    boletos: boletosQuery.data ?? [],
    payments: paymentsQuery.data ?? [],
    isLoading: boletosQuery.isLoading || paymentsQuery.isLoading,
    createBoleto: createBoletoMutation.mutateAsync,
    updateBoleto: updateBoletoMutation.mutateAsync,
    deleteBoleto: deleteBoletoMutation.mutateAsync,
    registerPayment: registerPaymentMutation.mutateAsync,
    uploadPdf,
    uploadReceipt,
    getSignedUrl,
    isCreating: createBoletoMutation.isPending,
    isUpdating: updateBoletoMutation.isPending,
    isDeleting: deleteBoletoMutation.isPending,
    isRegistering: registerPaymentMutation.isPending,
  };
}
