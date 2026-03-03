import { ServiceOrder, OSStatus } from '@/types/serviceOrder';
import { OSCard } from './OSCard';
import { cn } from '@/lib/utils';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface OSStatusBlockViewProps {
    orders: ServiceOrder[];
    onView: (order: ServiceOrder) => void;
    onEdit: (order: ServiceOrder) => void;
    onDelete: (order: ServiceOrder) => void;
    onStatusChange: (orderId: string, status: OSStatus) => void;
}

export function OSStatusBlockView({ orders, onView, onEdit, onDelete, onStatusChange }: OSStatusBlockViewProps) {
    const { statusConfig, orderedStatuses } = useStatusSettings();
    const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});

    const toggleStatus = (status: string) => {
        setCollapsedStatuses(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    const getOrdersByStatus = (status: OSStatus) => {
        return orders.filter(order => order.status === status);
    };

    // Sort statuses based on user requirements:
    // - Pending first
    // - Cancelled, Delivered, Completed last
    const sortedStatuses = useMemo(() => {
        const statuses = [...orderedStatuses];

        return statuses.sort((a, b) => {
            // Priority mapping
            const getPriority = (status: string) => {
                if (status === 'pending') return -100;
                if (status === 'completed') return 100;
                if (status === 'delivered') return 101;
                if (status === 'cancelled') return 102;

                // Use existing position for others
                return statusConfig[status]?.position || 0;
            };

            return getPriority(a) - getPriority(b);
        });
    }, [orderedStatuses, statusConfig]);

    return (
        <div className="space-y-6">
            {sortedStatuses.map((status) => {
                const statusOrders = getOrdersByStatus(status);
                const config = statusConfig[status];
                const isCollapsed = collapsedStatuses[status];

                if (statusOrders.length === 0) return null;

                return (
                    <div
                        key={status}
                        className="flex flex-col gap-3"
                    >
                        <button
                            onClick={() => toggleStatus(status)}
                            className="flex items-center gap-2 group w-full text-left"
                        >
                            <div className={cn(
                                "w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-110",
                                config.bgColor.replace('-100', '-500').replace('-50', '-500')
                            )} />
                            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                {config.label}
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {statusOrders.length}
                                </span>
                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </h3>
                            <div className="flex-1 h-px bg-border/60 ml-2" />
                        </button>

                        {!isCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {statusOrders.map((order) => (
                                    <OSCard
                                        key={order.id}
                                        order={order}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
