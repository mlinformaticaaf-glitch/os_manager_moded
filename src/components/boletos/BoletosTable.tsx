import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  FileText,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { Boleto, BoletoPayment, BOLETO_STATUS_LABELS, BoletoStatus } from '@/types/boleto';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoletosTableProps {
  boletos: Boleto[];
  payments: BoletoPayment[];
  onEdit: (boleto: Boleto) => void;
  onDelete: (boleto: Boleto) => void;
  onRegisterPayment: (boleto: Boleto) => void;
  onViewDetails: (boleto: Boleto) => void;
}

export function BoletosTable({
  boletos,
  payments,
  onEdit,
  onDelete,
  onRegisterPayment,
  onViewDetails,
}: BoletosTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredBoletos = boletos.filter((boleto) => {
    const matchesSearch = 
      boleto.issuer_name.toLowerCase().includes(search.toLowerCase()) ||
      boleto.barcode?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || boleto.status === statusFilter;

    const dueDate = parseISO(boleto.due_date);
    const matchesDateFrom = !dateFrom || dueDate >= parseISO(dateFrom);
    const matchesDateTo = !dateTo || dueDate <= parseISO(dateTo);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: BoletoStatus) => {
    const variants: Record<BoletoStatus, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
    };
    const colors: Record<BoletoStatus, string> = {
      pending: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      paid: 'bg-green-100 text-green-800 hover:bg-green-100',
      overdue: 'bg-red-100 text-red-800 hover:bg-red-100',
    };
    return (
      <Badge className={colors[status]}>
        {BOLETO_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getPayment = (boletoId: string) => {
    return payments.find(p => p.boleto_id === boletoId);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por emissor ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Em Aberto</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-auto"
            placeholder="De"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-auto"
            placeholder="Até"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Emissor</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Arquivos</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBoletos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum boleto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredBoletos.map((boleto) => {
                const payment = getPayment(boleto.id);
                return (
                  <TableRow key={boleto.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{boleto.issuer_name}</p>
                        {boleto.barcode && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {boleto.barcode}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(boleto.amount))}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(boleto.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {boleto.pdf_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Baixar PDF"
                            onClick={() => window.open(boleto.pdf_url!, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {payment?.receipt_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Ver comprovante"
                            onClick={() => window.open(payment.receipt_url!, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(boleto)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {boleto.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => onRegisterPayment(boleto)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Registrar Pagamento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEdit(boleto)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(boleto)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
