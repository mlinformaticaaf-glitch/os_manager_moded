import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Trash2, CreditCard, Eye, ShoppingBag } from 'lucide-react';
import { formatSaleNumber } from '@/lib/saleUtils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sale, SALE_PAYMENT_STATUS_OPTIONS } from '@/types/sale';
import { useIsMobile } from '@/hooks/use-mobile';

interface SalesTableProps {
    sales: Sale[];
    onMarkAsPaid: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
    onView: (sale: Sale) => void;
}

const getStatusBadge = (status: string) => {
    const option = SALE_PAYMENT_STATUS_OPTIONS.find(o => o.value === status);
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        pending: 'secondary',
        paid: 'default',
        partial: 'outline',
        cancelled: 'destructive',
    };

    return (
        <Badge variant={variants[status] || 'secondary'}>
            {option?.label || status}
        </Badge>
    );
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function SaleCard({ sale, onMarkAsPaid, onDelete, onView }: { sale: Sale; onMarkAsPaid: (sale: Sale) => void; onDelete: (sale: Sale) => void; onView: (sale: Sale) => void }) {
    return (
        <Card
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onView(sale)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-medium">#{formatSaleNumber(sale.sale_number, sale.created_at)}</p>
                            {getStatusBadge(sale.payment_status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {sale.client?.name || 'Venda Avulsa'}
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
                            <DropdownMenuItem onClick={() => onView(sale)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                            </DropdownMenuItem>
                            {sale.payment_status === 'pending' && (
                                <DropdownMenuItem onClick={() => onMarkAsPaid(sale)}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Marcar como Pago
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(sale)}
                                className="text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">{format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium text-lg">{formatCurrency(sale.total)}</p>
                </div>
            </div>
        </Card>
    );
}

export function SalesTable({ sales, onMarkAsPaid, onDelete, onView }: SalesTableProps) {
    const isMobile = useIsMobile();

    if (sales.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma venda encontrada</p>
                <p className="text-sm">Registre sua primeira venda clicando no botão acima</p>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="space-y-3">
                {sales.map((sale) => (
                    <SaleCard
                        key={sale.id}
                        sale={sale}
                        onMarkAsPaid={onMarkAsPaid}
                        onDelete={onDelete}
                        onView={onView}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Venda</TableHead>
                        <TableHead className="hidden md:table-cell">Cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">Data</TableHead>
                        <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.map((sale) => (
                        <TableRow
                            key={sale.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onView(sale)}
                        >
                            <TableCell>
                                <div>
                                    <p className="font-medium">#{formatSaleNumber(sale.sale_number, sale.created_at)}</p>
                                    <p className="text-xs text-muted-foreground md:hidden">
                                        {sale.client?.name || 'Venda Avulsa'}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {sale.client?.name || (
                                    <span className="text-muted-foreground">Venda Avulsa</span>
                                )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {sale.due_date ? (
                                    format(new Date(sale.due_date), 'dd/MM/yyyy', { locale: ptBR })
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(sale.total)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                {getStatusBadge(sale.payment_status)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover border border-border">
                                        <DropdownMenuItem onClick={() => onView(sale)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Visualizar
                                        </DropdownMenuItem>
                                        {sale.payment_status === 'pending' && (
                                            <DropdownMenuItem onClick={() => onMarkAsPaid(sale)}>
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Marcar como Pago
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => onDelete(sale)}
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
    );
}
