import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTransaction } from "@/types/financial";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyComparisonChartProps {
  transactions: FinancialTransaction[];
}

export function MonthlyComparisonChart({ transactions }: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    const months: { name: string; saldo: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, "MMM/yy", { locale: ptBR });

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
        name: monthName,
        saldo: income - expense,
      });
    }

    return months;
  }, [transactions]);

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Resultado Mensal</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">Balanço dos últimos 12 meses</p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="h-[200px] sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false} 
              />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value)
                }
                width={45}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                  'Saldo'
                ]}
              />
              <Bar dataKey="saldo" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.saldo >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
