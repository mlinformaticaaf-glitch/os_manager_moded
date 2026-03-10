import { Droppable } from '@hello-pangea/dnd';
import { ServiceOrder } from '@/types/serviceOrder';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { StatusConfigEntry } from '@/hooks/useStatusSettings';

interface KanbanColumnProps {
    status: string;
    config: StatusConfigEntry;
    orders: ServiceOrder[];
    onView: (order: ServiceOrder) => void;
    onEdit: (order: ServiceOrder) => void;
    onDelete: (order: ServiceOrder) => void;
}

export function KanbanColumn({
    status,
    config,
    orders,
    onView,
    onEdit,
    onDelete
}: KanbanColumnProps) {
    // Extract base color (e.g., 'yellow' from 'bg-yellow-100')
    const baseColor = config.bgColor.split('-')[1];

    return (
        <div className={cn(
            "flex-none w-64 sm:w-72 h-full flex flex-col rounded-xl p-2 border-t-4 transition-all duration-300",
            `bg-${baseColor}-50/30 border-${baseColor}-400/60 shadow-sm`,
            "dark:bg-slate-900/40 dark:border-t-primary/40"
        )}
            style={{
                boxShadow: `0 4px 6px -1px rgba(var(--${baseColor}-500-rgb, 0,0,0), 0.05)`
            }}
        >
            {/* Column Header */}
            <div className={cn(
                "flex items-center justify-between mb-3 p-1.5 rounded-lg",
                `bg-${baseColor}-100/50 dark:bg-${baseColor}-900/20`
            )}>
                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        "w-2 h-2 rounded-full shadow-sm animate-pulse",
                        `bg-${baseColor}-500`
                    )} />
                    <h3 className={cn(
                        "font-extrabold text-[10px] tracking-wider uppercase",
                        config.color
                    )}>
                        {config.label}
                    </h3>
                </div>
                <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                    config.color,
                    `bg-${baseColor}-500/10`
                )}>
                    {orders.length}
                </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                            "flex-1 overflow-y-auto space-y-2 pb-4 transition-colors min-h-[50px] custom-scrollbar rounded-md",
                            snapshot.isDraggingOver && "bg-muted/50"
                        )}
                    >
                        {orders.map((order, index) => (
                            <KanbanCard
                                key={order.id}
                                order={order}
                                index={index}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
