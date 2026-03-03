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
            return {
              ...item,
              service_order_id: id,
            };
          });

          const { error: itemsError } = await supabase
            .from('service_order_items')
            .insert(itemsWithOrderId);

          if (itemsError) throw itemsError;
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
    mutationFn: async ({ id, status }: { id: string; status: OSStatus }) => {
      if (!user) throw new Error('User not authenticated');

      const updates: any = { status };

      // Update timestamps based on status
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
        // Also ensure completed_at is set if it wasn't already
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      return { status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });

      toast({
        title: 'Status atualizado',
        description: 'O status da OS foi atualizado com sucesso.',
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

export function useServiceOrderLogs(orderId: string | null) {
  return useQuery({
    queryKey: ['service-order-logs', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('service_order_logs')
        .select('*')
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}
