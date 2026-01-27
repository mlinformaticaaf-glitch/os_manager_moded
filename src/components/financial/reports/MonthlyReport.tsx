import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { MonthlyData, ReportPeriod } from "./types";
import { exportMonthlyPDF, exportMonthlyExcel } from "./exportUtils";

interface MonthlyReportProps {
  data: MonthlyData[];
  period: ReportPeriod;
}

export function MonthlyReport({ data, period }: MonthlyReportProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totals = data.reduce(
    (acc, d) => ({
      receitas: acc.receitas + d.receitas,
      despesas: acc.despesas + d.despesas,
      saldo: acc.saldo + d.saldo,
    }),
    { receitas: 0, despesas: 0, saldo: 0 }
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Relatório Mensal de Faturamento</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMonthlyPDF(data, period)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMonthlyExcel(data, period)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-muted-foreground" fontSize={12} />
              <YAxis 
                className="text-muted-foreground" 
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Bar 
                dataKey="receitas" 
                name="Receitas" 
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="despesas" 
                name="Despesas" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Receitas</TableHead>
              <TableHead className="text-right">Despesas</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{d.mes}</TableCell>
                <TableCell className="text-right font-mono text-success">
                  {formatCurrency(d.receitas)}
                </TableCell>
                <TableCell className="text-right font-mono text-destructive">
                  {formatCurrency(d.despesas)}
                </TableCell>
                <TableCell className={`text-right font-mono font-bold ${
                  d.saldo >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {formatCurrency(d.saldo)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right font-mono text-success">
                {formatCurrency(totals.receitas)}
              </TableCell>
              <TableCell className="text-right font-mono text-destructive">
                {formatCurrency(totals.despesas)}
              </TableCell>
              <TableCell className={`text-right font-mono ${
                totals.saldo >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {formatCurrency(totals.saldo)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
