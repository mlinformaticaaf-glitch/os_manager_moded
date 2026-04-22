import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BalanceData, ReportPeriod } from "./types";
import { exportBalancePDF, exportBalanceCSV } from "./exportUtils";

interface BalanceReportProps {
  data: BalanceData;
  period: ReportPeriod;
}

export function BalanceReport({ data, period }: BalanceReportProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Balanço Financeiro por Período</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportBalancePDF(data, period)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportBalanceCSV(data, period)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Receitas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpCircle className="h-5 w-5 text-success" />
            <h3 className="font-semibold text-success">RECEITAS</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.receitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhuma receita no período
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.receitas.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.categoria}</TableCell>
                      <TableCell className="text-center">{r.quantidade}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.valor)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-success/10 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono text-success">
                      {formatCurrency(data.totalReceitas)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Despesas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">DESPESAS</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.despesas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhuma despesa no período
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.despesas.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{d.categoria}</TableCell>
                      <TableCell className="text-center">{d.quantidade}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(d.valor)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-destructive/10 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {formatCurrency(data.totalDespesas)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Saldo */}
        <div className={`p-4 rounded-lg text-center ${
          data.saldo >= 0 ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'
        }`}>
          <p className="text-sm text-muted-foreground mb-1">SALDO DO PERÍODO</p>
          <p className={`text-3xl font-bold ${data.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(data.saldo)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
