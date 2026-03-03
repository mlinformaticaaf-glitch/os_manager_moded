import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sale, SaleItem } from '@/types/sale';

export function useSales() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const salesQuery = useQuery({
        queryKey: ['sales', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('sales')
                .select(`
          *,
          client:clients(id, name, phone)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Sale[];
        },
        enabled: !!user?.id,
    });

    const createSale = useMutation({
        mutationFn: async ({
            sale,
            items
        }: {
            sale: Omit<Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at' | 'client' | 'items' | 'user_id'>;
            items: Omit<SaleItem, 'id' | 'sale_id'>[];
        }) => {
            if (!user?.id) throw new Error('Usuário não autenticado');

            // Create sale
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    ...sale,
                    user_id: user.id,
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // Create sale items
            if (items.length > 0) {
                const saleItems = items.map(item => ({
                    ...item,
                    sale_id: newSale.id,
                }));

                const { error: itemsError } = await supabase
                    .from('sale_items')
                    .insert(saleItems);

                if (itemsError) throw itemsError;

                // Update product stock for each item (deduct from stock)
                for (const item of items) {
                    if (item.product_id) {
                        // Get current stock
                        const { data: product, error: productError } = await supabase
                            .from('products')
                            .select('stock_quantity')
                            .eq('id', item.product_id)
                            .single();

                        if (productError) continue;

                        // Subtract quantity from stock
                        const newStock = Number(product.stock_quantity) - Number(item.quantity);

                        await supabase
                            .from('products')
                            .update({ stock_quantity: newStock })
                            .eq('id', item.product_id);
                    }
                }
            }

            // Create financial transaction (income)
            await supabase
                .from('financial_transactions')
                .insert({
                    user_id: user.id,
                    type: 'income',
                    category: 'sales',
                    reference_id: newSale.id,
                    description: `Venda #${newSale.sale_number}`,
                    amount: newSale.total,
                    due_date: sale.due_date || sale.sale_date,
                    paid_date: sale.payment_status === 'paid' ? new Date().toISOString().split('T')[0] : null,
                    status: sale.payment_status === 'paid' ? 'paid' : 'pending',
                    payment_method: sale.payment_method,
                });

            return newSale;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
            toast({
                title: 'Venda registrada',
                description: 'A venda foi cadastrada e o estoque atualizado.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao registrar venda',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const updateSale = useMutation({
        mutationFn: async ({
            id,
            sale,
            items
        }: {
            id: string;
            sale: Omit<Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at' | 'client' | 'items' | 'user_id'>;
            items: Omit<SaleItem, 'id' | 'sale_id'>[];
        }) => {
            if (!user?.id) throw new Error('Usuário não autenticado');

            // Get current sale items to revert stock
            const { data: currentItems } = await supabase
                .from('sale_items')
                .select('*')
                .eq('sale_id', id);

            // Revert stock for current items (add back to stock)
            if (currentItems) {
                for (const item of currentItems) {
                    if (item.product_id) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock_quantity')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            const newStock = Number(product.stock_quantity) + Number(item.quantity);

                            await supabase
                                .from('products')
                                .update({ stock_quantity: newStock })
                                .eq('id', item.product_id);
                        }
                    }
                }
            }

            // Delete current sale items
            await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', id);

            // Update sale
            const { data: updatedSale, error: saleError } = await supabase
                .from('sales')
                .update({
                    ...sale,
                })
                .eq('id', id)
                .select()
                .single();

            if (saleError) throw saleError;

            // Create new sale items
            if (items.length > 0) {
                const saleItems = items.map(item => ({
                    ...item,
                    sale_id: id,
                }));

                const { error: itemsError } = await supabase
                    .from('sale_items')
                    .insert(saleItems);

                if (itemsError) throw itemsError;

                // Update product stock for each new item (deduct from stock)
                for (const item of items) {
                    if (item.product_id) {
                        const { data: product, error: productError } = await supabase
                            .from('products')
                            .select('stock_quantity')
                            .eq('id', item.product_id)
                            .single();

                        if (productError) continue;

                        const newStock = Number(product.stock_quantity) - Number(item.quantity);

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
                    amount: sale.total,
                    due_date: sale.due_date || sale.sale_date,
                    paid_date: sale.payment_status === 'paid' ? new Date().toISOString().split('T')[0] : null,
                    status: sale.payment_status === 'paid' ? 'paid' : 'pending',
                    payment_method: sale.payment_method,
                })
                .eq('reference_id', id)
                .eq('category', 'sales');

            return updatedSale;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
            toast({
                title: 'Venda atualizada',
                description: 'A venda foi atualizada com sucesso.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao atualizar venda',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const updateSalePayment = useMutation({
        mutationFn: async ({ id, payment_status, payment_method }: { id: string; payment_status: string; payment_method?: string }) => {
            const updates: Record<string, unknown> = { payment_status };

            if (payment_status === 'paid') {
                updates.paid_at = new Date().toISOString();
            }
            if (payment_method) {
                updates.payment_method = payment_method;
            }

            const { data: updated, error } = await supabase
                .from('sales')
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
                .eq('category', 'sales');

            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
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

    const deleteSale = useMutation({
        mutationFn: async (id: string) => {
            // Get sale items to revert stock
            const { data: items } = await supabase
                .from('sale_items')
                .select('*')
                .eq('sale_id', id);

            // Revert stock for each item (add back to stock)
            if (items) {
                for (const item of items) {
                    if (item.product_id) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock_quantity')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            const newStock = Number(product.stock_quantity) + Number(item.quantity);

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
                .eq('category', 'sales');

            // Delete sale (items will cascade)
            const { error } = await supabase
                .from('sales')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
            toast({
                title: 'Venda excluída',
                description: 'A venda foi removida e o estoque revertido.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao excluir venda',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const fetchSaleItems = async (saleId: string): Promise<SaleItem[]> => {
        const { data, error } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', saleId);

        if (error) throw error;
        return data as SaleItem[];
    };

    return {
        sales: salesQuery.data ?? [],
        isLoading: salesQuery.isLoading,
        error: salesQuery.error,
        createSale,
        updateSale,
        updateSalePayment,
        deleteSale,
        fetchSaleItems,
    };
}
