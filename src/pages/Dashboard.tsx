import { ClipboardList, DollarSign, Users, Package, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentOS } from "@/components/dashboard/RecentOS";
import { DashboardStatusBlocks } from "@/components/dashboard/DashboardStatusBlocks";
import { DashboardOSList } from "@/components/dashboard/DashboardOSList";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

type OSViewMode = 'blocks' | 'list';

const OS_VIEW_MODE_KEY = 'dashboard-os-view-mode';

function getStoredOSViewMode(): OSViewMode {
  const stored = localStorage.getItem(OS_VIEW_MODE_KEY);
  if (stored === 'blocks' || stored === 'list') {
    return stored;
  }
  return 'blocks';
}

export function Dashboard() {
  const [osViewMode, setOSViewMode] = useState<OSViewMode>(getStoredOSViewMode);
  const { transactions } = useFinancialTransactions();
  const { orders: serviceOrders } = useServiceOrders();
  const { clients } = useClients();
  const { products } = useProducts();

  const handleOSViewModeChange = (mode: OSViewMode) => {
    setOSViewMode(mode);
    localStorage.setItem(OS_VIEW_MODE_KEY, mode);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // OS abertas (não concluídas nem entregues)
    const openOS = serviceOrders.filter(os =>
      !['completed', 'delivered', 'cancelled'].includes(os.status)
    ).length;

    // Faturamento do mês atual
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    transactions.forEach(t => {
      if (t.type !== 'income' || t.status === 'cancelled') return;

      const date = t.due_date ? parseISO(t.due_date) : null;
      if (!date) return;

      if (isWithinInterval(date, { start: monthStart, end: monthEnd })) {
        currentMonthRevenue += Number(t.amount);
      }
      if (isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd })) {
        lastMonthRevenue += Number(t.amount);
      }
    });

    const revenueChange = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(0)
      : 0;

    // Produtos com estoque baixo
    const lowStockProducts = products.filter(p =>
      p.stock_quantity <= p.min_stock && p.active
    ).length;

    return {
      openOS,
      currentMonthRevenue,
      revenueChange,
      clientsCount: clients.length,
      productsCount: products.filter(p => p.active).length,
      lowStockProducts,
    };
  }, [transactions, serviceOrders, clients, products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <StatCard
          title="OS Abertas"
          value={String(stats.openOS)}
          change={`${serviceOrders.filter(os => os.status === 'pending').length} pendentes`}
          changeType="neutral"
          icon={ClipboardList}
          href="/os"
        />
        <StatCard
          title="Faturamento Mensal"
          value={formatCurrency(stats.currentMonthRevenue)}
          change={`${Number(stats.revenueChange) >= 0 ? '+' : ''}${stats.revenueChange}% vs mês anterior`}
          changeType={Number(stats.revenueChange) >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="text-success"
          href="/financeiro"
        />
        <StatCard
          title="Clientes Ativos"
          value={String(stats.clientsCount)}
          change="cadastrados"
          changeType="neutral"
          icon={Users}
          iconColor="text-info"
          href="/clientes"
        />
        <StatCard
          title="Produtos em Estoque"
          value={String(stats.productsCount)}
          change={`${stats.lowStockProducts} em estoque baixo`}
          changeType={stats.lowStockProducts > 0 ? "negative" : "neutral"}
          icon={Package}
          iconColor="text-warning"
          href="/produtos"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <RecentOS />
      </div>

      {/* Status Blocks/List Section */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Status das OS</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Visão geral por categorias</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handleOSViewModeChange('blocks')}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors",
                osViewMode === 'blocks'
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Status</span>
            </button>
            <button
              onClick={() => handleOSViewModeChange('list')}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors",
                osViewMode === 'list'
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>

        {osViewMode === 'blocks' ? (
          <DashboardStatusBlocks />
        ) : (
          <div className="bg-card rounded-lg border border-border p-4">
            <DashboardOSList />
          </div>
        )}
      </div>
    </div>
  );
}
