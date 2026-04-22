import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { downloadCsv } from '@/lib/csvExport';
import { DREData, BalanceData, MonthlyData, ReportPeriod } from './types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatPeriod = (period: ReportPeriod) =>
  `${format(period.startDate, 'dd/MM/yyyy')} a ${format(period.endDate, 'dd/MM/yyyy')}`;

export function exportDREPDF(data: DREData, period: ReportPeriod) {
  const doc = new jsPDF();
  const tableData = [
    ['RECEITA BRUTA', formatCurrency(data.receitaBruta)],
    ['(-) Descontos', formatCurrency(data.descontos)],
    ['= RECEITA LIQUIDA', formatCurrency(data.receitaLiquida)],
    ['', ''],
    ['(-) Custo dos Servicos Prestados', formatCurrency(data.custoServicos)],
    ['(-) Custo dos Produtos Vendidos', formatCurrency(data.custoProdutos)],
    ['= LUCRO BRUTO', formatCurrency(data.lucroBruto)],
    ['', ''],
    ['DESPESAS OPERACIONAIS', ''],
    ['  Salarios', formatCurrency(data.despesasOperacionais.salarios)],
    ['  Aluguel', formatCurrency(data.despesasOperacionais.aluguel)],
    ['  Contas (agua, luz, etc)', formatCurrency(data.despesasOperacionais.contas)],
    ['  Outras Despesas', formatCurrency(data.despesasOperacionais.outras)],
    ['= Total Despesas Operacionais', formatCurrency(data.despesasOperacionais.total)],
    ['', ''],
    ['= LUCRO OPERACIONAL', formatCurrency(data.lucroOperacional)],
    ['', ''],
    ['= RESULTADO LIQUIDO DO PERIODO', formatCurrency(data.resultadoLiquido)],
  ];

  doc.setFontSize(18);
  doc.text('Demonstracao do Resultado do Exercicio (DRE)', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periodo: ${formatPeriod(period)}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 36);

  autoTable(doc, {
    startY: 44,
    head: [['Descricao', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' },
    },
    didParseCell: (cellData) => {
      if ([2, 6, 15, 17].includes(cellData.row.index)) {
        cellData.cell.styles.fontStyle = 'bold';
      }
      if (cellData.row.index === 17) {
        cellData.cell.styles.fillColor = [59, 130, 246];
        cellData.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  doc.save(`DRE_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.pdf`);
}

export function exportDRECSV(data: DREData, period: ReportPeriod) {
  downloadCsv(`DRE_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.csv`, [
    ['Demonstracao do Resultado do Exercicio (DRE)'],
    [`Periodo: ${formatPeriod(period)}`],
    [],
    ['Descricao', 'Valor'],
    ['RECEITA BRUTA', data.receitaBruta],
    ['(-) Descontos', data.descontos],
    ['= RECEITA LIQUIDA', data.receitaLiquida],
    [],
    ['(-) Custo dos Servicos Prestados', data.custoServicos],
    ['(-) Custo dos Produtos Vendidos', data.custoProdutos],
    ['= LUCRO BRUTO', data.lucroBruto],
    [],
    ['DESPESAS OPERACIONAIS', ''],
    ['  Salarios', data.despesasOperacionais.salarios],
    ['  Aluguel', data.despesasOperacionais.aluguel],
    ['  Contas (agua, luz, etc)', data.despesasOperacionais.contas],
    ['  Outras Despesas', data.despesasOperacionais.outras],
    ['= Total Despesas Operacionais', data.despesasOperacionais.total],
    [],
    ['= LUCRO OPERACIONAL', data.lucroOperacional],
    [],
    ['= RESULTADO LIQUIDO DO PERIODO', data.resultadoLiquido],
  ]);
}
export function exportBalancePDF(data: BalanceData, period: ReportPeriod) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Balanco Financeiro por Periodo', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periodo: ${formatPeriod(period)}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 36);

  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text('RECEITAS', 14, 50);

  autoTable(doc, {
    startY: 54,
    head: [['Categoria', 'Quantidade', 'Valor']],
    body: [
      ...data.receitas.map((item) => [item.categoria, item.quantidade.toString(), formatCurrency(item.valor)]),
      ['TOTAL', '', formatCurrency(data.totalReceitas)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 10 },
  });

  const receitasEndY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68);
  doc.text('DESPESAS', 14, receitasEndY + 16);

  autoTable(doc, {
    startY: receitasEndY + 20,
    head: [['Categoria', 'Quantidade', 'Valor']],
    body: [
      ...data.despesas.map((item) => [item.categoria, item.quantidade.toString(), formatCurrency(item.valor)]),
      ['TOTAL', '', formatCurrency(data.totalDespesas)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 10 },
  });

  const despesasEndY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(16);
  doc.setTextColor(data.saldo >= 0 ? 34 : 239, data.saldo >= 0 ? 197 : 68, data.saldo >= 0 ? 94 : 68);
  doc.text(`SALDO DO PERIODO: ${formatCurrency(data.saldo)}`, 14, despesasEndY + 20);
  doc.save(`Balanco_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.pdf`);
}

export function exportBalanceCSV(data: BalanceData, period: ReportPeriod) {
  downloadCsv(`Balanco_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.csv`, [
    ['Balanco Financeiro por Periodo'],
    [`Periodo: ${formatPeriod(period)}`],
    [],
    ['RECEITAS'],
    ['Categoria', 'Quantidade', 'Valor'],
    ...data.receitas.map((item) => [item.categoria, item.quantidade, item.valor]),
    ['TOTAL RECEITAS', '', data.totalReceitas],
    [],
    ['DESPESAS'],
    ['Categoria', 'Quantidade', 'Valor'],
    ...data.despesas.map((item) => [item.categoria, item.quantidade, item.valor]),
    ['TOTAL DESPESAS', '', data.totalDespesas],
    [],
    ['SALDO DO PERIODO', '', data.saldo],
  ]);
}

export function exportMonthlyPDF(data: MonthlyData[], period: ReportPeriod) {
  const doc = new jsPDF();
  const totalReceitas = data.reduce((sum, item) => sum + item.receitas, 0);
  const totalDespesas = data.reduce((sum, item) => sum + item.despesas, 0);
  const totalSaldo = data.reduce((sum, item) => sum + item.saldo, 0);

  doc.setFontSize(18);
  doc.text('Relatorio Mensal de Faturamento', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periodo: ${formatPeriod(period)}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 36);

  autoTable(doc, {
    startY: 44,
    head: [['Mes', 'Receitas', 'Despesas', 'Saldo']],
    body: [
      ...data.map((item) => [
        item.mes,
        formatCurrency(item.receitas),
        formatCurrency(item.despesas),
        formatCurrency(item.saldo),
      ]),
      ['TOTAL', formatCurrency(totalReceitas), formatCurrency(totalDespesas), formatCurrency(totalSaldo)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  doc.save(`Faturamento_Mensal_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.pdf`);
}

export function exportMonthlyCSV(data: MonthlyData[], period: ReportPeriod) {
  const totalReceitas = data.reduce((sum, item) => sum + item.receitas, 0);
  const totalDespesas = data.reduce((sum, item) => sum + item.despesas, 0);
  const totalSaldo = data.reduce((sum, item) => sum + item.saldo, 0);

  downloadCsv(`Faturamento_Mensal_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.csv`, [
    ['Relatorio Mensal de Faturamento'],
    [`Periodo: ${formatPeriod(period)}`],
    [],
    ['Mes', 'Receitas', 'Despesas', 'Saldo'],
    ...data.map((item) => [item.mes, item.receitas, item.despesas, item.saldo]),
    ['TOTAL', totalReceitas, totalDespesas, totalSaldo],
  ]);
}
