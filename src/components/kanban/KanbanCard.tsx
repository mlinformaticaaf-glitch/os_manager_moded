import { Draggable } from '@hello-pangea/dnd';
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
import { MoreHorizontal, Pencil, Trash2, Eye, Phone, User, GripVertical } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatOSNumber } from '@/lib/osUtils';
import { Clock } from 'lucide-react';

interface KanbanCardProps {
    order: ServiceOrder;
    index: number;
    onView: (order: ServiceOrder) => void;
    onEdit: (order: ServiceOrder) => void;
    onDelete: (order: ServiceOrder) => void;
}

export function KanbanCard({ order, index, onView, onEdit, onDelete }: KanbanCardProps) {
    const { getStatusConfig } = useStatusSettings();
    const statusCfg = getStatusConfig(order.status);
    const priorityConfig = PRIORITY_CONFIG[order.priority];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const daysAgo = differenceInDays(new Date(), new Date(order.created_at));

    const getAgeBadge = () => {
        // Se estiver concluído ou entregue, fica sempre verde
        const isFinished = order.status === 'completed' || order.status === 'delivered';

        if (daysAgo <= 2 || isFinished) return {
            color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
            icon: 'text-emerald-500',
            cardBg: 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/20',
            accent: 'bg-emerald-500'
        };
        if (daysAgo <= 4) return {
            color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
            icon: 'text-amber-500',
            cardBg: 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/20',
            accent: 'bg-amber-500'
        };
        return {
            color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
            icon: 'text-rose-500',
            cardBg: 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10 dark:border-rose-500/20',
            accent: 'bg-rose-500'
        };
    };

    const ageCfg = getAgeBadge();

    return (
        <Draggable draggableId={order.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "group relative transition-all duration-200 rounded-lg overflow-hidden border backdrop-blur-[2px]",
                        ageCfg.cardBg,
                        snapshot.isDragging && "shadow-xl z-50 rotate-3 ring-2 ring-primary bg-background/50",
                        !snapshot.isDragging && "hover:shadow-md hover:-translate-y-0.5"
                    )}
                    onClick={(e) => {
                        // Only trigger onView if not dragging
                        if (snapshot.isDragging) return;
                        onView(order);
                    }}
                >
                    {/* Draggable Indicator Side */}
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5",
                        ageCfg.accent,
                        snapshot.isDragging && "w-2"
                    )} />

                    <Card className="p-2 border-none shadow-none rounded-none bg-transparent select-none">
                        <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-[10px]">#{formatOSNumber(order.order_number, order.created_at)}</span>
                                    <Badge variant="outline" className={cn(
                                        'text-[8px] uppercase font-bold px-1.5 h-3.5',
                                        priorityConfig.color,
                                        'bg-transparent'
                                    )}>
                                        {priorityConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className={cn(
                                        'text-[8px] font-bold px-1 h-3.5 gap-0.5 border',
                                        ageCfg.color
                                    )}>
                                        <Clock className={cn("h-2 w-2", ageCfg.icon)} />
                                        {daysAgo}d
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                    {format(new Date(order.created_at), "dd MMM", { locale: ptBR })}
                                </div>
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 relative z-10">
                                            <MoreHorizontal className="h-3 w-3" />
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
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1 overflow-hidden">
                                <User className="h-2 w-2 shrink-0" />
                                <span className="font-medium text-foreground truncate">{order.client.name}</span>
                            </div>
                        )}

                        {(order.equipment || order.equipment_ref) && (
                            <p className="text-[10px] font-medium mb-0.5 truncate leading-tight">
                                {order.equipment || order.equipment_ref?.description}
                                {order.brand && ` - ${order.brand}`}
                            </p>
                        )}

                        <p className="text-[9px] text-muted-foreground line-clamp-1 leading-tight mb-2">
                            {order.reported_issue}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-border/30">
                            <span className="font-bold text-[10px] text-primary">{formatCurrency(order.total)}</span>
                            {snapshot.isDragging && <GripVertical className="h-2.5 w-2.5 text-muted-foreground/30" />}
                        </div>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
