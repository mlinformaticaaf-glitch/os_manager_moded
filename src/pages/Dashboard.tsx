import { ClipboardList, DollarSign, Users, Package, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentOS } from "@/components/dashboard/RecentOS";
import { KanbanBoard } from "@/components/os/KanbanBoard";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";

export function Dashboard() {
  const { transactions } = useFinancialTransactions();
  const { orders: serviceOrders } = useServiceOrders();
  const { clients } = useClients();
  const { products } = useProducts();

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
      if (t.type !== 'income' || t.status !== 'paid') return;
      const paidDate = t.paid_date ? parseISO(t.paid_date) : null;
      if (!paidDate) return;

      if (isWithinInterval(paidDate, { start: monthStart, end: monthEnd })) {
        currentMonthRevenue += Number(t.amount);
      }
      if (isWithinInterval(paidDate, { start: lastMonthStart, end: lastMonthEnd })) {
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
        />
        <StatCard
          title="Faturamento Mensal"
          value={formatCurrency(stats.currentMonthRevenue)}
          change={`${Number(stats.revenueChange) >= 0 ? '+' : ''}${stats.revenueChange}% vs mês anterior`}
          changeType={Number(stats.revenueChange) >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Clientes Ativos"
          value={String(stats.clientsCount)}
          change="cadastrados"
          changeType="neutral"
          icon={Users}
          iconColor="text-info"
        />
        <StatCard
          title="Produtos em Estoque"
          value={String(stats.productsCount)}
          change={`${stats.lowStockProducts} em estoque baixo`}
          changeType={stats.lowStockProducts > 0 ? "negative" : "neutral"}
          icon={Package}
          iconColor="text-warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <RecentOS />
      </div>

      {/* Kanban Section */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Quadro de OS</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe o fluxo de trabalho</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
              Quadro
            </button>
            <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              Lista
            </button>
          </div>
        </div>
        <KanbanBoard />
      </div>
    </div>
  );
}
