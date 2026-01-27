import { useMemo } from "react";
import { FinancialTransaction } from "@/types/financial";
import { isWithinInterval, parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReportPeriod, DREData, BalanceData, MonthlyData } from "./types";

export function useReportData(transactions: FinancialTransaction[], period: ReportPeriod) {
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = t.paid_date ? parseISO(t.paid_date) : t.due_date ? parseISO(t.due_date) : null;
      if (!date) return false;
      return isWithinInterval(date, { start: period.startDate, end: period.endDate });
    });
  }, [transactions, period]);

  const dreData = useMemo((): DREData => {
    // Receita Bruta (todas as receitas de OS e vendas)
    const receitaBruta = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Descontos aplicados
    const descontos = 0; // Pode ser expandido para pegar descontos reais das OS

    // Receita Líquida
    const receitaLiquida = receitaBruta - descontos;

    // Custo dos Serviços Prestados (compras de peças para OS)
    const custoServicos = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'service_order' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Custo de Produtos Vendidos (compras de estoque)
    const custoProdutos = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'purchase' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Lucro Bruto
    const lucroBruto = receitaLiquida - custoServicos - custoProdutos;

    // Despesas Operacionais
    const salarios = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'salary' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const aluguel = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'rent' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const contas = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'utilities' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const outras = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'other' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDespesasOperacionais = salarios + aluguel + contas + outras;

    // Lucro Operacional
    const lucroOperacional = lucroBruto - totalDespesasOperacionais;

    // Resultado Líquido (por enquanto igual ao operacional)
    const resultadoLiquido = lucroOperacional;

    return {
      receitaBruta,
      descontos,
      receitaLiquida,
      custoServicos,
      custoProdutos,
      lucroBruto,
      despesasOperacionais: {
        salarios,
        aluguel,
        contas,
        outras,
        total: totalDespesasOperacionais,
      },
      lucroOperacional,
      resultadoLiquido,
    };
  }, [filteredTransactions]);

  const balanceData = useMemo((): BalanceData => {
    const categoryMap: Record<string, { label: string }> = {
      service_order: { label: 'Ordens de Serviço' },
      purchase: { label: 'Compras' },
      salary: { label: 'Salários' },
      rent: { label: 'Aluguel' },
      utilities: { label: 'Contas' },
      other: { label: 'Outros' },
    };

    const receitasMap = new Map<string, { valor: number; quantidade: number }>();
    const despesasMap = new Map<string, { valor: number; quantidade: number }>();

    filteredTransactions
      .filter(t => t.status === 'paid')
      .forEach(t => {
        const map = t.type === 'income' ? receitasMap : despesasMap;
        const current = map.get(t.category) || { valor: 0, quantidade: 0 };
        map.set(t.category, {
          valor: current.valor + Number(t.amount),
          quantidade: current.quantidade + 1,
        });
      });

    const receitas = Array.from(receitasMap.entries()).map(([key, value]) => ({
      categoria: categoryMap[key]?.label || key,
      ...value,
    }));

    const despesas = Array.from(despesasMap.entries()).map(([key, value]) => ({
      categoria: categoryMap[key]?.label || key,
      ...value,
    }));

    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);

    return {
      receitas,
      despesas,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
    };
  }, [filteredTransactions]);

  const monthlyData = useMemo((): MonthlyData[] => {
    const months = eachMonthOfInterval({ start: period.startDate, end: period.endDate });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthTransactions = transactions.filter(t => {
        const date = t.paid_date ? parseISO(t.paid_date) : t.due_date ? parseISO(t.due_date) : null;
        if (!date) return false;
        return isWithinInterval(date, { start: monthStart, end: monthEnd }) && t.status === 'paid';
      });

      const receitas = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesas = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        mes: format(month, 'MMM/yy', { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });
  }, [transactions, period]);

  return {
    filteredTransactions,
    dreData,
    balanceData,
    monthlyData,
  };
}
