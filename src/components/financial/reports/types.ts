export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

export interface DREData {
  receitaBruta: number;
  descontos: number;
  receitaLiquida: number;
  custoServicos: number;
  custoProdutos: number;
  lucroBruto: number;
  despesasOperacionais: {
    salarios: number;
    aluguel: number;
    contas: number;
    outras: number;
    total: number;
  };
  lucroOperacional: number;
  resultadoLiquido: number;
}

export interface BalanceData {
  receitas: {
    categoria: string;
    valor: number;
    quantidade: number;
  }[];
  despesas: {
    categoria: string;
    valor: number;
    quantidade: number;
  }[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

export interface MonthlyData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}
