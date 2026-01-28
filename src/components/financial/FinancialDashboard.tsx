import { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { CashFlowChart } from "./CashFlowChart";
import { MonthlyComparisonChart } from "./MonthlyComparisonChart";
import { UpcomingTransactions } from "./UpcomingTransactions";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialTransaction } from "@/types/financial";

interface FinancialDashboardProps {
  onTransactionClick?: (transaction: FinancialTransaction) => void;
}

export function FinancialDashboard({ onTransactionClick }: FinancialDashboardProps) {
  const { transactions, isLoading } = useFinancialTransactions();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const next7Days = addDays(now, 7);

    let totalIncome = 0;
    let totalExpense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;
    let overdueCount = 0;

    transactions.forEach(t => {
      const dueDate = t.due_date ? parseISO(t.due_date) : null;
      const isThisMonth = dueDate && isWithinInterval(dueDate, { start: monthStart, end: monthEnd });

      if (t.type === 'income') {
        if (t.status === 'paid') {
          totalIncome += Number(t.amount);
        } else if (t.status === 'pending') {
          pendingIncome += Number(t.amount);
          if (dueDate && isBefore(dueDate, now)) {
            overdueCount++;
          }
        }
      } else {
        if (t.status === 'paid') {
          totalExpense += Number(t.amount);
        } else if (t.status === 'pending') {
          pendingExpense += Number(t.amount);
          if (dueDate && isBefore(dueDate, now)) {
            overdueCount++;
          }
        }
      }
    });

    const balance = totalIncome - totalExpense;
    const pendingBalance = pendingIncome - pendingExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
      pendingIncome,
      pendingExpense,
      pendingBalance,
      overdueCount,
    };
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
              Total Recebido
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-success truncate">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {formatCurrency(stats.pendingIncome)} a receber
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
              Total Pago
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive truncate">
              {formatCurrency(stats.totalExpense)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {formatCurrency(stats.pendingExpense)} a pagar
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
              Saldo Atual
            </CardTitle>
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${stats.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Projetado: {formatCurrency(stats.balance + stats.pendingBalance)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
              Contas Vencidas
            </CardTitle>
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-warning">
              {stats.overdueCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Pendentes de regularização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowChart transactions={transactions} />
        </div>
        <UpcomingTransactions transactions={transactions} onTransactionClick={onTransactionClick} />
      </div>

      {/* Monthly Comparison */}
      <MonthlyComparisonChart transactions={transactions} />
    </div>
  );
}
