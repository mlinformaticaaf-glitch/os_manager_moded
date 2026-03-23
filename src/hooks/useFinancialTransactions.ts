import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FinancialTransaction, FinancialTransactionInsert, FinancialTransactionUpdate } from '@/types/financial';

export type FinancialTransactionWithClient = FinancialTransaction & {
  client_name?: string | null;
};

export function useFinancialTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['financial-transactions', user?.id],
    queryFn: async (): Promise<FinancialTransactionWithClient[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      const transactions = data as FinancialTransaction[];

      // Fetch client names for service_order and sales transactions
      const soRefIds = transactions
        .filter(t => t.category === 'service_order' && t.reference_id)
        .map(t => t.reference_id as string);

      const saleRefIds = transactions
        .filter(t => t.category === 'sales' && t.reference_id)
        .map(t => t.reference_id as string);

      const directClientIds = transactions
        .filter(t => t.client_id)
        .map(t => t.client_id as string);

      const clientMap = new Map<string, string>();

      if (soRefIds.length > 0) {
        const { data: orders } = await supabase
          .from('service_orders')
          .select('id, client:clients(name)')
          .in('id', soRefIds);

        if (orders) {
          for (const o of orders as any[]) {
            if (o.client?.name) {
              clientMap.set(o.id, o.client.name);
            }
          }
        }
      }

      if (saleRefIds.length > 0) {
        const { data: sales } = await supabase
          .from('sales')
          .select('id, client:clients(name)')
          .in('id', saleRefIds);

        if (sales) {
          for (const s of sales as any[]) {
            if (s.client?.name) {
              clientMap.set(s.id, s.client.name);
            }
          }
        }
      }

      if (directClientIds.length > 0) {
        const { data: directClients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', directClientIds);

        if (directClients) {
          for (const c of directClients) {
            clientMap.set(c.id, c.name);
          }
        }
      }

      return transactions.map(t => {
        let client_name = null;
        if (t.reference_id) {
          client_name = clientMap.get(t.reference_id) || null;
        }
        if (!client_name && t.client_id) {
          client_name = clientMap.get(t.client_id) || null;
        }
        return {
          ...t,
          client_name,
        };
      });
    },
    enabled: !!user?.id,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: Omit<FinancialTransactionInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...transaction,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Transação criada',
        description: 'A transação foi cadastrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FinancialTransactionUpdate }) => {
      const { data: updated, error } = await supabase
        .from('financial_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Transação atualizada',
        description: 'A transação foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
