import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { ServiceOrder, OSStatus } from '@/types/serviceOrder';
import { KanbanColumn } from './KanbanColumn';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout, Columns } from 'lucide-react';

interface KanbanBoardProps {
    orders: ServiceOrder[];
    onStatusChange: (orderId: string, status: OSStatus) => void;
    onView: (order: ServiceOrder) => void;
    onEdit: (order: ServiceOrder) => void;
    onDelete: (order: ServiceOrder) => void;
}

export function KanbanBoard({
    orders,
    onStatusChange,
    onView,
    onEdit,
    onDelete
}: KanbanBoardProps) {
    const { orderedStatuses, statusConfig } = useStatusSettings();

    // Local state for immediate UI feedback
    const [localOrders, setLocalOrders] = useState<ServiceOrder[]>(orders);
    const [hiddenStatuses, setHiddenStatuses] = useState<string[]>(() => {
        const saved = localStorage.getItem('kanban-hidden-columns');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        setLocalOrders(orders);
    }, [orders]);

    useEffect(() => {
        localStorage.setItem('kanban-hidden-columns', JSON.stringify(hiddenStatuses));
    }, [hiddenStatuses]);

    const toggleStatus = (status: string) => {
        setHiddenStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const visibleStatuses = useMemo(() => {
        return orderedStatuses.filter(status => !hiddenStatuses.includes(status));
    }, [orderedStatuses, hiddenStatuses]);

    const ordersByStatus = useMemo(() => {
        const map: Record<string, ServiceOrder[]> = {};

        orderedStatuses.forEach(status => {
            map[status] = localOrders
                .filter(order => order.status === status)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });

        return map;
    }, [localOrders, orderedStatuses]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        // If dropped in same column and same position, do nothing
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceStatus = source.droppableId;
        const destStatus = destination.droppableId;

        // If dropped in same column (even if different position), do nothing 
        // since we sort by date, drag-and-drop within the same column is not persistent
        if (sourceStatus === destStatus) {
            return;
        }

        // Trigger update to new status
        onStatusChange(draggableId, destStatus as OSStatus);

        // Update local state for immediate feedback
        const newLocalOrders = localOrders.map(o =>
            o.id === draggableId ? { ...o, status: destStatus as OSStatus } : o
        );
        setLocalOrders(newLocalOrders);
    };

    return (
        <div className="flex flex-col h-full space-y-2">
            <div className="flex justify-end pr-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs border-dashed">
                            <Columns className="h-3.5 w-3.5" />
                            Colunas
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Visibilidade das Colunas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {orderedStatuses.map((status) => (
                            <DropdownMenuCheckboxItem
                                key={status}
                                checked={!hiddenStatuses.includes(status)}
                                onCheckedChange={() => toggleStatus(status)}
                            >
                                {statusConfig[status]?.label || status}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex flex-1 gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {visibleStatuses.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            config={statusConfig[status]}
                            orders={ordersByStatus[status] || []}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                    {visibleStatuses.length === 0 && (
                        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground border-2 border-dashed rounded-xl">
                            <Layout className="h-12 w-12 mb-2 opacity-20" />
                            <p className="text-sm">Nenhuma coluna visível</p>
                            <Button
                                variant="link"
                                onClick={() => setHiddenStatuses([])}
                                className="mt-2"
                            >
                                Mostrar todas as colunas
                            </Button>
                        </div>
                    )}
                </div>
            </DragDropContext>
        </div>
    );
}
