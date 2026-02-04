import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Boleto, BoletoPayment, BOLETO_STATUS_LABELS } from '@/types/boleto';
import { format, isToday, isBefore, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface BoletosDashboardProps {
  boletos: Boleto[];
  payments: BoletoPayment[];
  onViewBoleto: (boleto: Boleto) => void;
}

export function BoletosDashboard({ boletos, payments, onViewBoleto }: BoletosDashboardProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const metrics = useMemo(() => {
    const monthBoletos = boletos.filter(b => {
      const dueDate = parseISO(b.due_date);
      return dueDate >= monthStart && dueDate <= monthEnd;
    });

    const totalToPay = monthBoletos
      .filter(b => b.status !== 'paid')
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const totalPaid = monthBoletos
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const overdue = boletos.filter(b => b.status === 'overdue').length;
    const dueToday = boletos.filter(b => 
      b.status === 'pending' && isToday(parseISO(b.due_date))
    ).length;

    return { totalToPay, totalPaid, overdue, dueToday };
  }, [boletos, monthStart, monthEnd]);

  const upcomingBoletos = useMemo(() => {
    return boletos
      .filter(b => b.status !== 'paid')
      .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
      .slice(0, 5);
  }, [boletos]);

  const recentPayments = useMemo(() => {
    return payments.slice(0, 5);
  }, [payments]);

  const chartData = useMemo(() => {
    const pending = boletos.filter(b => b.status === 'pending').length;
    const paid = boletos.filter(b => b.status === 'paid').length;
    const overdue = boletos.filter(b => b.status === 'overdue').length;

    return [
      { name: 'Em Aberto', quantidade: pending, fill: '#3b82f6' },
      { name: 'Pagos', quantidade: paid, fill: '#22c55e' },
      { name: 'Vencidos', quantidade: overdue, fill: '#ef4444' },
    ];
  }, [boletos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: Boleto['status']) => {
    const variants: Record<Boleto['status'], 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
    };
    return (
      <Badge variant={variants[status]} className="text-xs">
        {BOLETO_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total a Pagar (Mês)
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.totalToPay)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pago (Mês)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Boletos Vencidos
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.overdue}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencem Hoje
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {metrics.dueToday}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBoletos.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum boleto em aberto.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBoletos.map((boleto) => (
                  <div
                    key={boleto.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => onViewBoleto(boleto)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{boleto.issuer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence em {format(parseISO(boleto.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {formatCurrency(Number(boleto.amount))}
                      </span>
                      {getStatusBadge(boleto.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5" />
              Últimos Pagamentos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => {
                const boleto = boletos.find(b => b.id === payment.boleto_id);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {boleto?.issuer_name || 'Boleto'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pago em {format(parseISO(payment.paid_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(Number(payment.amount_paid))}
                      </span>
                      {payment.receipt_url && (
                        <Badge variant="outline" className="text-xs">
                          Comprovante
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
