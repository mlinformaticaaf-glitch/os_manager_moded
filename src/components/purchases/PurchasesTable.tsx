import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Trash2, CreditCard, Eye, ShoppingCart } from 'lucide-react';
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
import { Purchase, PAYMENT_STATUS_OPTIONS } from '@/types/purchase';
import { useIsMobile } from '@/hooks/use-mobile';

interface PurchasesTableProps {
  purchases: Purchase[];
  onMarkAsPaid: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
  onView: (purchase: Purchase) => void;
}

const getStatusBadge = (status: string) => {
  const option = PAYMENT_STATUS_OPTIONS.find(o => o.value === status);
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

function PurchaseCard({ purchase, onMarkAsPaid, onDelete, onView }: { purchase: Purchase; onMarkAsPaid: (purchase: Purchase) => void; onDelete: (purchase: Purchase) => void; onView: (purchase: Purchase) => void }) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onView(purchase)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">#{purchase.purchase_number}</p>
              {getStatusBadge(purchase.payment_status)}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {purchase.supplier?.name || 'Sem fornecedor'}
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
              <DropdownMenuItem onClick={() => onView(purchase)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              {purchase.payment_status === 'pending' && (
                <DropdownMenuItem onClick={() => onMarkAsPaid(purchase)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Marcar como Pago
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(purchase)}
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
          <p className="font-medium">{format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-medium text-lg">{formatCurrency(purchase.total)}</p>
        </div>
      </div>
    </Card>
  );
}

export function PurchasesTable({ purchases, onMarkAsPaid, onDelete, onView }: PurchasesTableProps) {
  const isMobile = useIsMobile();

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhuma compra encontrada</p>
        <p className="text-sm">Registre sua primeira compra clicando no botão acima</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {purchases.map((purchase) => (
          <PurchaseCard
            key={purchase.id}
            purchase={purchase}
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
            <TableHead>Compra</TableHead>
            <TableHead className="hidden md:table-cell">Fornecedor</TableHead>
            <TableHead className="hidden sm:table-cell">Data</TableHead>
            <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow 
              key={purchase.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(purchase)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">#{purchase.purchase_number}</p>
                  {purchase.invoice_number && (
                    <p className="text-sm text-muted-foreground">NF: {purchase.invoice_number}</p>
                  )}
                  <p className="text-xs text-muted-foreground md:hidden">
                    {purchase.supplier?.name || '-'}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {purchase.supplier?.name || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {purchase.due_date ? (
                  format(new Date(purchase.due_date), 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(purchase.total)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {getStatusBadge(purchase.payment_status)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border border-border">
                    <DropdownMenuItem onClick={() => onView(purchase)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    {purchase.payment_status === 'pending' && (
                      <DropdownMenuItem onClick={() => onMarkAsPaid(purchase)}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Marcar como Pago
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDelete(purchase)}
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
