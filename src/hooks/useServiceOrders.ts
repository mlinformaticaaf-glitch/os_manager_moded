import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrder, ServiceOrderItem, OSStatus } from '@/types/serviceOrder';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatOSNumber } from '@/lib/osUtils';
export function useServiceOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['service-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(id, name, phone, email),
          equipment_ref:equipment(id, code, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceOrder[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (order: Omit<ServiceOrder, 'id' | 'order_number' | 'updated_at' | 'client' | 'items' | 'user_id'> & { created_at?: string; items?: Omit<ServiceOrderItem, 'id' | 'service_order_id' | 'created_at'>[] }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { items, created_at, ...orderData } = order;
      
      const insertData: any = { ...orderData, user_id: user.id };
      if (created_at) {
        insertData.created_at = created_at;
      }

      const { data: newOrder, error: orderError } = await supabase
        .from('service_orders')
        .insert(insertData)
        .select()
        .single();

      if (orderError) throw orderError;

      if (items && items.length > 0) {
        const itemsWithOrderId = items.map(item => {
          // Remove product_id as it doesn't exist in the database schema
          const { product_id, ...itemData } = item as any;
          return {
            ...itemData,
            service_order_id: newOrder.id,
          };
        });

        const { error: itemsError } = await supabase
          .from('service_order_items')
          .insert(itemsWithOrderId);

        if (itemsError) throw itemsError;
      }

      return newOrder as ServiceOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast({
        title: 'OS criada',
        description: 'A ordem de serviço foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar OS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<ServiceOrder> & { id: string; items?: Omit<ServiceOrderItem, 'id' | 'service_order_id' | 'created_at'>[] }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get current order to check payment status changes
      const { data: currentOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select('order_number, payment_status, total, created_at')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: orderError } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id);

      if (orderError) throw orderError;

      if (items !== undefined) {
        // Delete existing items and insert new ones
        await supabase
          .from('service_order_items')
          .delete()
          .eq('service_order_id', id);

        if (items.length > 0) {
          const itemsWithOrderId = items.map(item => {
            // Remove product_id as it doesn't exist in the database schema
            const { product_id, ...itemData } = item as any;
            return {
              ...itemData,
              service_order_id: id,
            };
          });

          const { error: itemsError } = await supabase
            .from('service_order_items')
            .insert(itemsWithOrderId);

          if (itemsError) throw itemsError;
        }
      }

      // Handle financial transaction when payment status changes
      const newPaymentStatus = updates.payment_status;
      const oldPaymentStatus = currentOrder?.payment_status;
      const orderTotal = updates.total ?? currentOrder?.total ?? 0;
      const orderNumber = currentOrder?.order_number;

      if (newPaymentStatus && newPaymentStatus !== oldPaymentStatus) {
        // Check if transaction already exists
        const { data: existingTransaction } = await supabase
          .from('financial_transactions')
          .select('id')
          .eq('reference_id', id)
          .eq('category', 'service_order')
          .maybeSingle();

        if (newPaymentStatus === 'paid') {
          if (existingTransaction) {
            // Update existing transaction
            await supabase
              .from('financial_transactions')
              .update({
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0],
                amount: orderTotal,
                payment_method: updates.payment_method,
              })
              .eq('id', existingTransaction.id);
          } else {
            // Create new income transaction
            const osNumber = formatOSNumber(currentOrder.order_number, currentOrder.created_at);
            await supabase
              .from('financial_transactions')
              .insert({
                user_id: user.id,
                type: 'income',
                category: 'service_order',
                reference_id: id,
                description: `OS ${osNumber}`,
                amount: orderTotal,
                due_date: new Date().toISOString().split('T')[0],
                paid_date: new Date().toISOString().split('T')[0],
                status: 'paid',
                payment_method: updates.payment_method,
              });
          }
        } else if (newPaymentStatus === 'pending' && existingTransaction) {
          // Revert to pending
          await supabase
            .from('financial_transactions')
            .update({
              status: 'pending',
              paid_date: null,
            })
            .eq('id', existingTransaction.id);
        } else if (newPaymentStatus === 'partial' && existingTransaction) {
          // Mark as partial payment
          await supabase
            .from('financial_transactions')
            .update({
              status: 'pending',
              notes: 'Pagamento parcial',
            })
            .eq('id', existingTransaction.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'OS atualizada',
        description: 'A ordem de serviço foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar OS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, previousStatus }: { id: string; status: OSStatus; previousStatus?: OSStatus }) => {
      if (!user) throw new Error('User not authenticated');
      
      const updates: Record<string, unknown> = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      // Get the current order to check stock_deducted status and other details
      const { data: currentOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select('stock_deducted, order_number, total, payment_method, payment_status, created_at')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Handle stock deduction only when delivering (Faturado e Entregue)
      const shouldDeductStock = status === 'delivered' && !currentOrder?.stock_deducted;
      
      // Handle stock return when cancelling
      const shouldReturnStock = status === 'cancelled' && currentOrder?.stock_deducted;

      if (shouldDeductStock || shouldReturnStock) {
        // Get all product items from this order
        const { data: items, error: itemsError } = await supabase
          .from('service_order_items')
          .select('*')
          .eq('service_order_id', id)
          .eq('type', 'product');

        if (itemsError) throw itemsError;

        // Update stock for each product
        if (items && items.length > 0) {
          for (const item of items) {
            // Try to find the product by name
            const { data: products, error: productError } = await supabase
              .from('products')
              .select('id, stock_quantity')
              .eq('name', item.description)
              .limit(1);

            if (productError) throw productError;

            if (products && products.length > 0) {
              const product = products[0];
              const newQuantity = shouldDeductStock
                ? Math.max(0, product.stock_quantity - item.quantity)
                : product.stock_quantity + item.quantity;

              await supabase
                .from('products')
                .update({ stock_quantity: newQuantity })
                .eq('id', product.id);
            }
          }
        }

        updates.stock_deducted = shouldDeductStock;
      }

      const { error } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Create financial transaction when status changes to "delivered"
      let transactionCreated = false;
      if (status === 'delivered' && previousStatus !== 'delivered') {
        const orderTotal = currentOrder?.total ?? 0;
        const orderNumber = currentOrder?.order_number;
        const createdAt = currentOrder?.created_at;

        // Check if transaction already exists for this order
        const { data: existingTransaction } = await supabase
          .from('financial_transactions')
          .select('id')
          .eq('reference_id', id)
          .eq('category', 'service_order')
          .maybeSingle();

        if (!existingTransaction && orderTotal > 0 && orderNumber && createdAt) {
          // Create income transaction
          const osNumber = formatOSNumber(orderNumber, createdAt);
          const { error: transactionError } = await supabase
            .from('financial_transactions')
            .insert({
              user_id: user.id,
              type: 'income',
              category: 'service_order',
              reference_id: id,
              description: `OS ${osNumber}`,
              amount: orderTotal,
              due_date: new Date().toISOString().split('T')[0],
              paid_date: currentOrder?.payment_status === 'paid' ? new Date().toISOString().split('T')[0] : null,
              status: currentOrder?.payment_status === 'paid' ? 'paid' : 'pending',
              payment_method: currentOrder?.payment_method,
            });

          if (transactionError) {
            console.error('Error creating financial transaction:', transactionError);
          } else {
            transactionCreated = true;
          }
        } else if (existingTransaction) {
          // Update existing transaction status if payment was made
          if (currentOrder?.payment_status === 'paid') {
            await supabase
              .from('financial_transactions')
              .update({
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0],
                amount: orderTotal,
                payment_method: currentOrder?.payment_method,
              })
              .eq('id', existingTransaction.id);
          }
        }
      }

      // Handle cancellation - cancel the financial transaction too
      if (status === 'cancelled') {
        const { data: existingTransaction } = await supabase
          .from('financial_transactions')
          .select('id')
          .eq('reference_id', id)
          .eq('category', 'service_order')
          .maybeSingle();

        if (existingTransaction) {
          await supabase
            .from('financial_transactions')
            .update({ status: 'cancelled' })
            .eq('id', existingTransaction.id);
        }
      }

      return { shouldDeductStock, shouldReturnStock, transactionCreated };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      
      let description = 'O status da OS foi atualizado.';
      if (result?.transactionCreated) {
        description = 'Status atualizado e lançamento financeiro criado.';
      } else if (result?.shouldDeductStock) {
        description = 'Status atualizado e estoque baixado automaticamente.';
      } else if (result?.shouldReturnStock) {
        description = 'Status atualizado e estoque devolvido automaticamente.';
      }
      
      toast({
        title: 'Status atualizado',
        description,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast({
        title: 'OS excluída',
        description: 'A ordem de serviço foi excluída.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir OS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    createOrder,
    updateOrder,
    updateStatus,
    deleteOrder,
  };
}

export function useServiceOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ['service-order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('service_order_items')
        .select('*')
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ServiceOrderItem[];
    },
    enabled: !!orderId,
  });
}
