import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Purchase, PurchaseItem } from '@/types/purchase';

export function usePurchases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purchasesQuery = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!user?.id,
  });

  const createPurchase = useMutation({
    mutationFn: async ({ 
      purchase, 
      items 
    }: { 
      purchase: Omit<Purchase, 'id' | 'purchase_number' | 'created_at' | 'updated_at' | 'supplier' | 'items' | 'user_id'>; 
      items: Omit<PurchaseItem, 'id' | 'purchase_id'>[];
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Create purchase
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          ...purchase,
          user_id: user.id,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      if (items.length > 0) {
        const purchaseItems = items.map(item => ({
          ...item,
          purchase_id: newPurchase.id,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItems);

        if (itemsError) throw itemsError;

        // Update product stock for each item
        for (const item of items) {
          if (item.product_id) {
            // Get current stock
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (productError) continue;

            // Add quantity to stock
            const newStock = Number(product.stock_quantity) + Number(item.quantity);
            
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id);
          }
        }
      }

      // Create financial transaction (expense)
      await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          type: 'expense',
          category: 'purchase',
          reference_id: newPurchase.id,
          description: `Compra #${newPurchase.purchase_number}`,
          amount: newPurchase.total,
          due_date: purchase.due_date,
          paid_date: purchase.payment_status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          status: purchase.payment_status === 'paid' ? 'paid' : 'pending',
          payment_method: purchase.payment_method,
        });

      return newPurchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Compra registrada',
        description: 'A compra foi cadastrada e o estoque atualizado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar compra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePurchase = useMutation({
    mutationFn: async ({ 
      id,
      purchase, 
      items 
    }: { 
      id: string;
      purchase: Omit<Purchase, 'id' | 'purchase_number' | 'created_at' | 'updated_at' | 'supplier' | 'items' | 'user_id'>; 
      items: Omit<PurchaseItem, 'id' | 'purchase_id'>[];
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Get current purchase items to revert stock
      const { data: currentItems } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', id);

      // Revert stock for current items
      if (currentItems) {
        for (const item of currentItems) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (product) {
              const newStock = Math.max(0, Number(product.stock_quantity) - Number(item.quantity));
              
              await supabase
                .from('products')
                .update({ stock_quantity: newStock })
                .eq('id', item.product_id);
            }
          }
        }
      }

      // Delete current purchase items
      await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);

      // Update purchase
      const { data: updatedPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .update({
          ...purchase,
        })
        .eq('id', id)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create new purchase items
      if (items.length > 0) {
        const purchaseItems = items.map(item => ({
          ...item,
          purchase_id: id,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItems);

        if (itemsError) throw itemsError;

        // Update product stock for each new item
        for (const item of items) {
          if (item.product_id) {
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (productError) continue;

            const newStock = Number(product.stock_quantity) + Number(item.quantity);
            
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id);
          }
        }
      }

      // Update financial transaction
      await supabase
        .from('financial_transactions')
        .update({
          amount: purchase.total,
          due_date: purchase.due_date,
          paid_date: purchase.payment_status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          status: purchase.payment_status === 'paid' ? 'paid' : 'pending',
          payment_method: purchase.payment_method,
        })
        .eq('reference_id', id)
        .eq('category', 'purchase');

      return updatedPurchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Compra atualizada',
        description: 'A compra foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar compra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePurchasePayment = useMutation({
    mutationFn: async ({ id, payment_status, payment_method }: { id: string; payment_status: string; payment_method?: string }) => {
      const updates: Record<string, unknown> = { payment_status };
      
      if (payment_status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }
      if (payment_method) {
        updates.payment_method = payment_method;
      }

      const { data: updated, error } = await supabase
        .from('purchases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update financial transaction
      await supabase
        .from('financial_transactions')
        .update({
          status: payment_status === 'paid' ? 'paid' : payment_status === 'cancelled' ? 'cancelled' : 'pending',
          paid_date: payment_status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          payment_method: payment_method,
        })
        .eq('reference_id', id)
        .eq('category', 'purchase');

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Pagamento atualizado',
        description: 'O status do pagamento foi atualizado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      // Get purchase items to revert stock
      const { data: items } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', id);

      // Revert stock for each item
      if (items) {
        for (const item of items) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (product) {
              const newStock = Math.max(0, Number(product.stock_quantity) - Number(item.quantity));
              
              await supabase
                .from('products')
                .update({ stock_quantity: newStock })
                .eq('id', item.product_id);
            }
          }
        }
      }

      // Delete financial transaction
      await supabase
        .from('financial_transactions')
        .delete()
        .eq('reference_id', id)
        .eq('category', 'purchase');

      // Delete purchase (items will cascade)
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Compra excluída',
        description: 'A compra foi removida e o estoque revertido.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir compra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const fetchPurchaseItems = async (purchaseId: string): Promise<PurchaseItem[]> => {
    const { data, error } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', purchaseId);

    if (error) throw error;
    return data as PurchaseItem[];
  };

  return {
    purchases: purchasesQuery.data ?? [],
    isLoading: purchasesQuery.isLoading,
    error: purchasesQuery.error,
    createPurchase,
    updatePurchase,
    updatePurchasePayment,
    deletePurchase,
    fetchPurchaseItems,
  };
}
