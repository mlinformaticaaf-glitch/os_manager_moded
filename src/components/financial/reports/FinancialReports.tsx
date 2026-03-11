import { useState } from "react";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText, BarChart3, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useReportData } from "./useReportData";
import { DREReport } from "./DREReport";
import { BalanceReport } from "./BalanceReport";
import { MonthlyReport } from "./MonthlyReport";
import { ReportPeriod } from "./types";

type QuickPeriod = 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'custom';

export function FinancialReports() {
  const { transactions, isLoading } = useFinancialTransactions();
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('current-month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const getQuickPeriodDates = (period: QuickPeriod): ReportPeriod => {
    const now = new Date();
    switch (period) {
      case 'current-month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last-month': {
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      }
      case 'last-3-months':
        return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
      case 'last-6-months':
        return { startDate: startOfMonth(subMonths(now, 5)), endDate: endOfMonth(now) };
      case 'current-year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'custom':
        return { startDate, endDate };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  };

  const handleQuickPeriodChange = (value: QuickPeriod) => {
    setQuickPeriod(value);
    if (value !== 'custom') {
      const dates = getQuickPeriodDates(value);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  const period = getQuickPeriodDates(quickPeriod);
  const { dreData, balanceData, monthlyData } = useReportData(transactions, period);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-48" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Período:</span>
            </div>

            <Select value={quickPeriod} onValueChange={(v) => handleQuickPeriodChange(v as QuickPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="last-month">Mês Anterior</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
                <SelectItem value="current-year">Ano Atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {quickPeriod === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">até</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {format(period.startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até{' '}
              {format(period.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="dre" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            DRE
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Balanço
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Faturamento Mensal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dre">
          <DREReport data={dreData} period={period} />
        </TabsContent>

        <TabsContent value="balance">
          <BalanceReport data={balanceData} period={period} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyReport data={monthlyData} period={period} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
