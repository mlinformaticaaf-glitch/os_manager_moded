import { useMemo } from "react";
import { ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialTransaction } from "@/types/financial";
import { format, parseISO, addDays, isBefore, isAfter, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingTransactionsProps {
  transactions: FinancialTransaction[];
  onTransactionClick?: (transaction: FinancialTransaction) => void;
}

export function UpcomingTransactions({ transactions, onTransactionClick }: UpcomingTransactionsProps) {
  const upcomingTransactions = useMemo(() => {
    const now = new Date();
    const next30Days = addDays(now, 30);

    return transactions
      .filter(t => {
        if (t.status !== 'pending') return false;
        if (!t.due_date) return false;

        const dueDate = parseISO(t.due_date);
        return isBefore(dueDate, next30Days);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.due_date!);
        const dateB = parseISO(b.due_date!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 8);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date();
    const date = parseISO(dueDate);
    const days = differenceInDays(date, now);

    if (days < 0) {
      return { label: `${Math.abs(days)}d atrás`, variant: 'destructive' as const };
    } else if (days === 0) {
      return { label: 'Hoje', variant: 'warning' as const };
    } else if (days <= 3) {
      return { label: `${days}d`, variant: 'warning' as const };
    } else {
      return { label: format(date, 'dd/MM', { locale: ptBR }), variant: 'secondary' as const };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          Próximos Vencimentos
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">Próximos 30 dias</p>
      </CardHeader>
      <CardContent className="p-0">
        {upcomingTransactions.length === 0 ? (
          <div className="p-4 sm:p-6 text-center text-muted-foreground">
            <p className="text-sm">Nenhuma conta pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcomingTransactions.map((transaction) => {
              const dueStatus = getDueDateStatus(transaction.due_date!);

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpCircle className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{transaction.description}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {transaction.category === 'service_order' && 'Ordem de Serviço (Entrada)'}
                      {transaction.category === 'services' && 'Serviços (Entrada)'}
                      {transaction.category === 'sales' && 'Vendas (Entrada)'}
                      {transaction.category === 'purchase' && 'Compra (Saída)'}
                      {transaction.category === 'expenses' && 'Despesas (Saída)'}
                      {transaction.category === 'withdrawals' && 'Retiradas (Saída)'}
                      {transaction.category === 'other' && 'Outros'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs sm:text-sm font-medium ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant={dueStatus.variant} className="text-[9px] sm:text-[10px] mt-0.5">
                      {dueStatus.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
