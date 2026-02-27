import { ServiceOrder, PRIORITY_CONFIG } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye, Phone, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatOSNumber } from '@/lib/osUtils';

interface OSCardProps {
  order: ServiceOrder;
  onView: (order: ServiceOrder) => void;
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
}

export function OSCard({ order, onView, onEdit, onDelete }: OSCardProps) {
  const { statusConfig } = useStatusSettings();
  const statusCfg = statusConfig[order.status];
  const priorityConfig = PRIORITY_CONFIG[order.priority];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card 
      className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(order)}
    >
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm sm:text-lg">#{formatOSNumber(order.order_number, order.created_at)}</span>
          <Badge className={cn('text-[10px] sm:text-xs', priorityConfig.color, 'bg-transparent border')}>
            {priorityConfig.label}
          </Badge>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
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

      {order.client && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="font-medium text-foreground truncate">{order.client.name}</span>
          {order.client.phone && (
            <>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Phone className="h-3 w-3 hidden sm:block" />
              <span className="hidden sm:inline">{order.client.phone}</span>
            </>
          )}
        </div>
      )}

      {order.equipment && (
        <p className="text-xs sm:text-sm font-medium mb-1 truncate">
          {order.equipment}
          {order.brand && ` - ${order.brand}`}
          {order.model && ` ${order.model}`}
        </p>
      )}

      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
        {order.reported_issue}
      </p>

      <div className="flex items-center justify-between">
        <Badge className={cn('text-[10px] sm:text-xs', statusCfg.color, statusCfg.bgColor)}>
          {statusCfg.shortLabel}
        </Badge>
        <div className="text-right">
          <p className="font-semibold text-sm sm:text-base">{formatCurrency(order.total)}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yy", { locale: ptBR })}
          </p>
        </div>
      </div>
    </Card>
  );
}
