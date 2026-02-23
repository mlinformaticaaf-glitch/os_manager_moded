import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { FinancialTransaction, TRANSACTION_CATEGORY_OPTIONS, TRANSACTION_STATUS_OPTIONS } from "@/types/financial";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionsTableProps {
  filterType?: 'income' | 'expense';
  filterStatus?: 'pending' | 'paid';
  onEdit: (transaction: FinancialTransaction) => void;
  onNew: () => void;
}

function TransactionCard({ 
  transaction, 
  onEdit, 
  onDelete, 
  onMarkAsPaid 
}: { 
  transaction: FinancialTransaction; 
  onEdit: (transaction: FinancialTransaction) => void; 
  onDelete: (transaction: FinancialTransaction) => void;
  onMarkAsPaid: (transaction: FinancialTransaction) => void;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" className="text-[10px]">Pago</Badge>;
      case 'pending':
        return <Badge variant="warning" className="text-[10px]">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="text-[10px]">Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const option = TRANSACTION_CATEGORY_OPTIONS.find(c => c.value === category);
    return option?.label || category;
  };

  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onEdit(transaction)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {transaction.type === 'income' ? (
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="h-5 w-5 text-success" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="h-5 w-5 text-destructive" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{transaction.description}</p>
              {getStatusBadge(transaction.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getCategoryLabel(transaction.category)}
            </p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border">
              {transaction.status === 'pending' && (
                <DropdownMenuItem onClick={() => onMarkAsPaid(transaction)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Pago
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(transaction)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {transaction.due_date 
            ? format(parseISO(transaction.due_date), 'dd/MM/yyyy', { locale: ptBR })
            : 'Sem vencimento'
          }
        </span>
        <span className={`font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      </div>
    </Card>
  );
}

export function TransactionsTable({ filterType, filterStatus, onEdit, onNew }: TransactionsTableProps) {
  const { transactions, isLoading, updateTransaction, deleteTransaction } = useFinancialTransactions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTransaction_, setDeleteTransaction] = useState<FinancialTransaction | null>(null);
  const isMobile = useIsMobile();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (filterType && t.type !== filterType) return false;
      
      // Fixed status filter from prop
      if (filterStatus && t.status !== filterStatus) return false;

      // Status filter from dropdown
      if (!filterStatus && statusFilter !== 'all' && t.status !== statusFilter) return false;
      
      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [transactions, filterType, statusFilter, search]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleMarkAsPaid = async (transaction: FinancialTransaction) => {
    await updateTransaction.mutateAsync({
      id: transaction.id,
      data: {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      }
    });
  };

  const handleDelete = async () => {
    if (deleteTransaction_) {
      await deleteTransaction.mutateAsync(deleteTransaction_.id);
      setDeleteTransaction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Pago</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const option = TRANSACTION_CATEGORY_OPTIONS.find(c => c.value === category);
    return option?.label || category;
  };

  const title = filterType === 'income' 
    ? 'Contas a Receber' 
    : filterType === 'expense' 
      ? 'Contas a Pagar' 
      : 'Todas as Transações';

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button onClick={onNew} size="sm" className="shrink-0 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TRANSACTION_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        ) : isMobile ? (
          <div className="space-y-3 p-4">
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={onEdit}
                onDelete={setDeleteTransaction}
                onMarkAsPaid={handleMarkAsPaid}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onEdit(transaction)}
                  >
                    <TableCell>
                      {transaction.type === 'income' ? (
                        <ArrowUpCircle className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{getCategoryLabel(transaction.category)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{getCategoryLabel(transaction.category)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {transaction.due_date 
                        ? format(parseISO(transaction.due_date), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className={`text-right ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border border-border">
                          {transaction.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(transaction)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEdit(transaction)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteTransaction(transaction)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <DeleteTransactionDialog
        open={!!deleteTransaction_}
        onOpenChange={() => setDeleteTransaction(null)}
        onConfirm={handleDelete}
        transaction={deleteTransaction_}
      />
    </Card>
  );
}
