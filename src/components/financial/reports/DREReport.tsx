import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DREData, ReportPeriod } from "./types";
import { exportDREPDF, exportDRECSV } from "./exportUtils";

interface DREReportProps {
  data: DREData;
  period: ReportPeriod;
}

export function DREReport({ data, period }: DREReportProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderLine = (
    label: string, 
    value: number, 
    level: 'main' | 'sub' | 'total' = 'main',
    showIcon = false
  ) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    
    return (
      <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${
        level === 'total' ? 'bg-primary/10 font-bold text-lg' :
        level === 'sub' ? 'pl-8 text-muted-foreground' : ''
      }`}>
        <span className={level === 'total' ? 'text-foreground' : ''}>{label}</span>
        <span className={`font-mono flex items-center gap-2 ${
          level === 'total' 
            ? isPositive ? 'text-success' : isNegative ? 'text-destructive' : ''
            : ''
        }`}>
          {showIcon && (
            isPositive ? <TrendingUp className="h-4 w-4 text-success" /> :
            isNegative ? <TrendingDown className="h-4 w-4 text-destructive" /> :
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          {formatCurrency(value)}
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDREPDF(data, period)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDRECSV(data, period)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="border-b border-border pb-4">
          {renderLine('RECEITA BRUTA', data.receitaBruta)}
          {renderLine('(-) Descontos', -data.descontos, 'sub')}
          {renderLine('= RECEITA LÍQUIDA', data.receitaLiquida, 'main')}
        </div>

        <div className="border-b border-border py-4">
          {renderLine('(-) Custo dos Serviços Prestados', -data.custoServicos, 'sub')}
          {renderLine('(-) Custo dos Produtos Vendidos', -data.custoProdutos, 'sub')}
          {renderLine('= LUCRO BRUTO', data.lucroBruto, 'main')}
        </div>

        <div className="border-b border-border py-4">
          <div className="font-medium text-muted-foreground mb-2">DESPESAS OPERACIONAIS</div>
          {renderLine('Salários', -data.despesasOperacionais.salarios, 'sub')}
          {renderLine('Aluguel', -data.despesasOperacionais.aluguel, 'sub')}
          {renderLine('Contas (água, luz, etc)', -data.despesasOperacionais.contas, 'sub')}
          {renderLine('Outras Despesas', -data.despesasOperacionais.outras, 'sub')}
          {renderLine('= Total Despesas Operacionais', -data.despesasOperacionais.total, 'main')}
        </div>

        <div className="border-b border-border py-4">
          {renderLine('= LUCRO OPERACIONAL', data.lucroOperacional, 'main')}
        </div>

        <div className="pt-4">
          {renderLine('= RESULTADO LÍQUIDO DO PERÍODO', data.resultadoLiquido, 'total', true)}
        </div>
      </CardContent>
    </Card>
  );
}
