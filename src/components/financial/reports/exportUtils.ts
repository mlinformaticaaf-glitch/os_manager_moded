import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DREData, BalanceData, MonthlyData, ReportPeriod } from './types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPeriod = (period: ReportPeriod) => {
  return `${format(period.startDate, 'dd/MM/yyyy')} a ${format(period.endDate, 'dd/MM/yyyy')}`;
};

// DRE Export
export function exportDREPDF(data: DREData, period: ReportPeriod) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Demonstração do Resultado do Exercício (DRE)', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período: ${formatPeriod(period)}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 36);

  const tableData = [
    ['RECEITA BRUTA', formatCurrency(data.receitaBruta)],
    ['(-) Descontos', formatCurrency(data.descontos)],
    ['= RECEITA LÍQUIDA', formatCurrency(data.receitaLiquida)],
    ['', ''],
    ['(-) Custo dos Serviços Prestados', formatCurrency(data.custoServicos)],
    ['(-) Custo dos Produtos Vendidos', formatCurrency(data.custoProdutos)],
    ['= LUCRO BRUTO', formatCurrency(data.lucroBruto)],
    ['', ''],
    ['DESPESAS OPERACIONAIS', ''],
    ['  Salários', formatCurrency(data.despesasOperacionais.salarios)],
    ['  Aluguel', formatCurrency(data.despesasOperacionais.aluguel)],
    ['  Contas (água, luz, etc)', formatCurrency(data.despesasOperacionais.contas)],
    ['  Outras Despesas', formatCurrency(data.despesasOperacionais.outras)],
    ['= Total Despesas Operacionais', formatCurrency(data.despesasOperacionais.total)],
    ['', ''],
    ['= LUCRO OPERACIONAL', formatCurrency(data.lucroOperacional)],
    ['', ''],
    ['= RESULTADO LÍQUIDO DO PERÍODO', formatCurrency(data.resultadoLiquido)],
  ];

  autoTable(doc, {
    startY: 44,
    head: [['Descrição', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' },
    },
    didParseCell: function(data) {
      if (data.row.index === 2 || data.row.index === 6 || data.row.index === 15 || data.row.index === 17) {
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 17) {
        data.cell.styles.fillColor = [59, 130, 246];
        data.cell.styles.textColor = [255, 255, 255];
      }
    }
  });

  doc.save(`DRE_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.pdf`);
}

export function exportDREExcel(data: DREData, period: ReportPeriod) {
  const wsData = [
    ['Demonstração do Resultado do Exercício (DRE)'],
    [`Período: ${formatPeriod(period)}`],
    [''],
    ['Descrição', 'Valor'],
    ['RECEITA BRUTA', data.receitaBruta],
    ['(-) Descontos', data.descontos],
    ['= RECEITA LÍQUIDA', data.receitaLiquida],
    [''],
    ['(-) Custo dos Serviços Prestados', data.custoServicos],
    ['(-) Custo dos Produtos Vendidos', data.custoProdutos],
    ['= LUCRO BRUTO', data.lucroBruto],
    [''],
    ['DESPESAS OPERACIONAIS', ''],
    ['  Salários', data.despesasOperacionais.salarios],
    ['  Aluguel', data.despesasOperacionais.aluguel],
    ['  Contas (água, luz, etc)', data.despesasOperacionais.contas],
    ['  Outras Despesas', data.despesasOperacionais.outras],
    ['= Total Despesas Operacionais', data.despesasOperacionais.total],
    [''],
    ['= LUCRO OPERACIONAL', data.lucroOperacional],
    [''],
    ['= RESULTADO LÍQUIDO DO PERÍODO', data.resultadoLiquido],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DRE');

  // Format currency column
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 4; R <= range.e.r; ++R) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
    if (cell && typeof cell.v === 'number') {
      cell.z = '"R$"#,##0.00';
    }
  }

  XLSX.writeFile(wb, `DRE_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.xlsx`);
}

// Balance Export
export function exportBalancePDF(data: BalanceData, period: ReportPeriod) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Balanço Financeiro por Período', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período: ${formatPeriod(period)}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 36);

  // Receitas
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text('RECEITAS', 14, 50);

  autoTable(doc, {
    startY: 54,
    head: [['Categoria', 'Quantidade', 'Valor']],
    body: [
      ...data.receitas.map(r => [r.categoria, r.quantidade.toString(), formatCurrency(r.valor)]),
      ['TOTAL', '', formatCurrency(data.totalReceitas)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 10 },
    didParseCell: function(data) {
      if (data.row.index === data.table.body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [34, 197, 94];
        data.cell.styles.textColor = [255, 255, 255];
      }
    }
  });

  const receitasEndY = (doc as any).lastAutoTable.finalY;

  // Despesas
  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68);
  doc.text('DESPESAS', 14, receitasEndY + 16);

  autoTable(doc, {
    startY: receitasEndY + 20,
    head: [['Categoria', 'Quantidade', 'Valor']],
    body: [
      ...data.despesas.map(d => [d.categoria, d.quantidade.toString(), formatCurrency(d.valor)]),
      ['TOTAL', '', formatCurrency(data.totalDespesas)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 10 },
    didParseCell: function(data) {
      if (data.row.index === data.table.body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [239, 68, 68];
        data.cell.styles.textColor = [255, 255, 255];
      }
    }
  });

  const despesasEndY = (doc as any).lastAutoTable.finalY;

  // Saldo
  doc.setFontSize(16);
  doc.setTextColor(data.saldo >= 0 ? 34 : 239, data.saldo >= 0 ? 197 : 68, data.saldo >= 0 ? 94 : 68);
  doc.text(`SALDO DO PERÍODO: ${formatCurrency(data.saldo)}`, 14, despesasEndY + 20);

  doc.save(`Balanco_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.pdf`);
}

export function exportBalanceExcel(data: BalanceData, period: ReportPeriod) {
  const wsData = [
    ['Balanço Financeiro por Período'],
    [`Período: ${formatPeriod(period)}`],
    [''],
    ['RECEITAS'],
    ['Categoria', 'Quantidade', 'Valor'],
    ...data.receitas.map(r => [r.categoria, r.quantidade, r.valor]),
    ['TOTAL RECEITAS', '', data.totalReceitas],
    [''],
    ['DESPESAS'],
    ['Categoria', 'Quantidade', 'Valor'],
    ...data.despesas.map(d => [d.categoria, d.quantidade, d.valor]),
    ['TOTAL DESPESAS', '', data.totalDespesas],
    [''],
    ['SALDO DO PERÍODO', '', data.saldo],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Balanço');

  XLSX.writeFile(wb, `Balanco_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.xlsx`);
}

// Monthly Report Export
export function exportMonthlyPDF(data: MonthlyData[], period: ReportPeriod) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Relatório Mensal de Faturamento', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período: ${formatPeriod(period)}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 36);

  const totalReceitas = data.reduce((sum, d) => sum + d.receitas, 0);
  const totalDespesas = data.reduce((sum, d) => sum + d.despesas, 0);
  const totalSaldo = data.reduce((sum, d) => sum + d.saldo, 0);

  autoTable(doc, {
    startY: 44,
    head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
    body: [
      ...data.map(d => [d.mes, formatCurrency(d.receitas), formatCurrency(d.despesas), formatCurrency(d.saldo)]),
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
    didParseCell: function(data) {
      if (data.row.index === data.table.body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [59, 130, 246];
        data.cell.styles.textColor = [255, 255, 255];
      }
      // Color saldo based on value
      if (data.column.index === 3 && data.row.index < data.table.body.length - 1) {
        const rowData = data.table.body[data.row.index];
        const saldoStr = String(rowData[3]);
        if (saldoStr.includes('-')) {
          data.cell.styles.textColor = [239, 68, 68];
        } else {
          data.cell.styles.textColor = [34, 197, 94];
        }
      }
    }
  });

  doc.save(`Faturamento_Mensal_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.pdf`);
}

export function exportMonthlyExcel(data: MonthlyData[], period: ReportPeriod) {
  const totalReceitas = data.reduce((sum, d) => sum + d.receitas, 0);
  const totalDespesas = data.reduce((sum, d) => sum + d.despesas, 0);
  const totalSaldo = data.reduce((sum, d) => sum + d.saldo, 0);

  const wsData = [
    ['Relatório Mensal de Faturamento'],
    [`Período: ${formatPeriod(period)}`],
    [''],
    ['Mês', 'Receitas', 'Despesas', 'Saldo'],
    ...data.map(d => [d.mes, d.receitas, d.despesas, d.saldo]),
    ['TOTAL', totalReceitas, totalDespesas, totalSaldo],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faturamento Mensal');

  XLSX.writeFile(wb, `Faturamento_Mensal_${format(period.startDate, 'yyyy-MM')}_${format(period.endDate, 'yyyy-MM')}.xlsx`);
}
