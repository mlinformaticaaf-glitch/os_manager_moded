import { ServiceOrder, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/serviceOrder';
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
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye, User, Phone, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatOSNumber } from '@/lib/osUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OSListViewProps {
  orders: ServiceOrder[];
  onView: (order: ServiceOrder) => void;
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
}

function OSListCard({ order, onView, onEdit, onDelete }: { order: ServiceOrder; onView: (order: ServiceOrder) => void; onEdit: (order: ServiceOrder) => void; onDelete: (order: ServiceOrder) => void }) {
  const statusConfig = STATUS_CONFIG[order.status];
  const priorityConfig = PRIORITY_CONFIG[order.priority];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onView(order)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">#{formatOSNumber(order.order_number, order.created_at)}</span>
              <Badge className={cn('text-[10px]', statusConfig.color, statusConfig.bgColor)}>
                {statusConfig.label}
              </Badge>
              <span className={cn('text-[10px] font-medium', priorityConfig.color)}>
                {priorityConfig.label}
              </span>
            </div>
            {order.client && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                <span className="truncate">{order.client.name}</span>
                {order.client.phone && (
                  <>
                    <Phone className="h-3 w-3 ml-1" />
                    <span className="text-xs">{order.client.phone}</span>
                  </>
                )}
              </div>
            )}
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
              <DropdownMenuItem onClick={() => onView(order)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(order)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(order)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {order.equipment && (
        <p className="text-sm mt-2 truncate">
          {order.equipment}
          {order.brand && ` - ${order.brand}`}
          {order.model && ` ${order.model}`}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </span>
        <span className="font-semibold">{formatCurrency(order.total)}</span>
      </div>
    </Card>
  );
}

export function OSListView({ orders, onView, onEdit, onDelete }: OSListViewProps) {
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma ordem de serviço encontrada. Clique em "Nova OS" para criar.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <OSListCard
            key={order.id}
            order={order}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Nº</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Equipamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Prioridade</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="hidden sm:table-cell">Data</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const priorityConfig = PRIORITY_CONFIG[order.priority];

            return (
              <TableRow key={order.id} className="cursor-pointer" onClick={() => onView(order)}>
                <TableCell className="font-bold">#{formatOSNumber(order.order_number, order.created_at)}</TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate max-w-[150px]">{order.client?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground md:hidden truncate">
                      {order.equipment || '-'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {order.equipment
                    ? `${order.equipment}${order.brand ? ` - ${order.brand}` : ''}${order.model ? ` ${order.model}` : ''}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', statusConfig.color, statusConfig.bgColor)}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className={cn('text-sm font-medium', priorityConfig.color)}>
                    {priorityConfig.label}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {format(new Date(order.created_at), "dd/MM/yy", { locale: ptBR })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border border-border">
                      <DropdownMenuItem onClick={() => onView(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(order)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
