import { useMemo, useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { usePurchases } from '@/hooks/usePurchases';
import { useFinancialTransactions } from '@/hooks/useFinancialTransactions';
import { formatOSNumber } from '@/lib/osUtils';

export interface Notification {
  id: string;
  type: 'low_stock' | 'overdue_os' | 'overdue_purchase' | 'overdue_financial' | 'overdue_receivable';
  title: string;
  description: string;
  route: string;
  state: Record<string, string>;
  severity: 'warning' | 'error';
}

const DISMISSED_KEY = 'dismissed_notifications';

function getDismissedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export function useNotifications() {
  const { products, isLoading: productsLoading } = useProducts();
  const { orders, isLoading: ordersLoading } = useServiceOrders();
  const { purchases, isLoading: purchasesLoading } = usePurchases();
  const { transactions, isLoading: financialLoading } = useFinancialTransactions();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(getDismissedIds);

  const allNotifications = useMemo(() => {
    const notifs: Notification[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Products with low stock
    products
      .filter(p => p.active && p.stock_quantity <= p.min_stock)
      .forEach(product => {
        notifs.push({
          id: `low_stock_${product.id}`,
          type: 'low_stock',
          title: 'Estoque Baixo',
          description: `${product.name} (${product.stock_quantity}/${product.min_stock} ${product.unit || 'un'})`,
          route: '/produtos',
          state: { viewProductId: product.id },
          severity: product.stock_quantity === 0 ? 'error' : 'warning',
        });
      });

    // Service orders with overdue delivery
    orders
      .filter(os => {
        const notDelivered = !['completed', 'delivered', 'cancelled'].includes(os.status);
        const hasEstimatedDate = !!os.estimated_completion;
        const isOverdue = os.estimated_completion && os.estimated_completion < today;
        return notDelivered && hasEstimatedDate && isOverdue;
      })
      .forEach(os => {
        notifs.push({
          id: `overdue_os_${os.id}`,
          type: 'overdue_os',
          title: 'OS com Prazo Vencido',
          description: `OS #${formatOSNumber(os.order_number, os.created_at)} - ${os.client?.name || 'Sem cliente'}`,
          route: '/os',
          state: { viewOrderId: os.id },
          severity: 'error',
        });
      });

    // Purchases with pending payment and past due date
    purchases
      .filter(purchase => {
        const isPending = purchase.payment_status === 'pending';
        const hasDueDate = !!purchase.due_date;
        const isOverdue = purchase.due_date && purchase.due_date < today;
        return isPending && hasDueDate && isOverdue;
      })
      .forEach(purchase => {
        notifs.push({
          id: `overdue_purchase_${purchase.id}`,
          type: 'overdue_purchase',
          title: 'Compra Vencida',
          description: `Compra #${purchase.purchase_number} - ${purchase.supplier?.name || 'Sem fornecedor'}`,
          route: '/compras',
          state: { viewPurchaseId: purchase.id },
          severity: 'error',
        });
      });

    // Financial transactions overdue — expenses (A Pagar)
    transactions
      .filter(transaction => {
        const isPending = transaction.status === 'pending';
        const isExpense = transaction.type === 'expense';
        const hasDueDate = !!transaction.due_date;
        const isDueOrOverdue = transaction.due_date && transaction.due_date <= today;
        return isPending && isExpense && hasDueDate && isDueOrOverdue;
      })
      .forEach(transaction => {
        notifs.push({
          id: `overdue_financial_${transaction.id}`,
          type: 'overdue_financial',
          title: 'Conta a Pagar Vencida',
          description: `${transaction.description} - R$ ${Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          route: '/financeiro',
          state: { viewTransactionId: transaction.id },
          severity: 'error',
        });
      });

    // Financial transactions overdue — income (A Receber)
    transactions
      .filter(transaction => {
        const isPending = transaction.status === 'pending';
        const isIncome = transaction.type === 'income';
        const hasDueDate = !!transaction.due_date;
        const isDueOrOverdue = transaction.due_date && transaction.due_date <= today;
        return isPending && isIncome && hasDueDate && isDueOrOverdue;
      })
      .forEach(transaction => {
        notifs.push({
          id: `overdue_receivable_${transaction.id}`,
          type: 'overdue_receivable',
          title: 'Conta a Receber Vencida',
          description: `${transaction.description} - R$ ${Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          route: '/financeiro',
          state: { viewTransactionId: transaction.id },
          severity: 'warning',
        });
      });

    return notifs;
  }, [products, orders, purchases, transactions]);

  const isLoading = productsLoading || ordersLoading || purchasesLoading || financialLoading;

  // NOTE: We intentionally do NOT clean up dismissed IDs when a notification disappears.
  // This ensures that once a user dismisses a notification, it never reappears,
  // even if the underlying data reloads or is temporarily unavailable.

  const notifications = useMemo(
    () => allNotifications.filter(n => !dismissedIds.has(n.id)),
    [allNotifications, dismissedIds]
  );

  const dismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedIds(next);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const allIds = new Set(allNotifications.map(n => n.id));
    saveDismissedIds(allIds);
    setDismissedIds(allIds);
  }, [allNotifications]);

  return {
    notifications,
    isLoading,
    count: notifications.length,
    dismiss,
    dismissAll,
  };
}
