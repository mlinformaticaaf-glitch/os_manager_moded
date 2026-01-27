import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RevenueChart() {
  const { transactions } = useFinancialTransactions();

  const data = useMemo(() => {
    const months: { name: string; receita: number; despesas: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, "MMM", { locale: ptBR });

      let income = 0;
      let expense = 0;

      transactions.forEach(t => {
        if (t.status !== 'paid') return;
        
        const paidDate = t.paid_date ? parseISO(t.paid_date) : null;
        if (!paidDate) return;

        if (isWithinInterval(paidDate, { start: monthStart, end: monthEnd })) {
          if (t.type === 'income') {
            income += Number(t.amount);
          } else {
            expense += Number(t.amount);
          }
        }
      });

      months.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        receita: income,
        despesas: expense,
      });
    }

    return months;
  }, [transactions]);

  return (
    <div className="stat-card h-[280px] sm:h-[320px] md:h-[340px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Faturamento vs Despesas</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive/60" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(220, 14%, 18%)" 
            vertical={false} 
          />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
            tickFormatter={(value) => `${value / 1000}k`}
            width={35}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(220, 18%, 12%)',
              border: '1px solid hsl(220, 14%, 18%)',
              borderRadius: '8px',
              color: 'hsl(210, 20%, 95%)',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReceita)"
          />
          <Area
            type="monotone"
            dataKey="despesas"
            stroke="hsl(0, 72%, 51%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDespesas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
