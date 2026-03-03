import { cn } from "@/lib/utils";
import { Clock, User, Loader2, ChevronRight } from "lucide-react";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useStatusSettings } from "@/hooks/useStatusSettings";
import { OSStatus, PRIORITY_CONFIG } from "@/types/serviceOrder";
import { formatOSNumber } from "@/lib/osUtils";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export function DashboardStatusBlocks() {
    const { orders, isLoading } = useServiceOrders();
    const { statusConfig, orderedStatuses } = useStatusSettings();
    const navigate = useNavigate();

    const getOrdersByStatus = (status: OSStatus) => {
        return orders.filter(order => order.status === status);
    };

    const handleViewOS = (orderId: string) => {
        navigate('/os', { state: { viewOrderId: orderId } });
    };

    // Sort statuses based on user requirements:
    // - Pending first
    // - Cancelled, Delivered, Completed last
    const sortedStatuses = useMemo(() => {
        const statuses = [...orderedStatuses];

        return statuses.sort((a, b) => {
            const getPriority = (status: string) => {
                if (status === 'pending') return -100;
                if (status === 'completed') return 100;
                if (status === 'delivered') return 101;
                if (status === 'cancelled') return 102;
                return statusConfig[status]?.position || 0;
            };
            return getPriority(a) - getPriority(b);
        });
    }, [orderedStatuses, statusConfig]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {sortedStatuses.map((status) => {
                const statusOrders = getOrdersByStatus(status);
                const config = statusConfig[status];

                if (statusOrders.length === 0) return null;

                return (
                    <div key={status} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full", config.bgColor.replace('-100', '-500').replace('-50', '-500'))} />
                            <h3 className="font-semibold text-foreground text-sm sm:text-base">{config.label}</h3>
                            <span className="bg-muted text-muted-foreground text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full">
                                {statusOrders.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {statusOrders.map((order) => {
                                const priorityCfg = PRIORITY_CONFIG[order.priority];
                                return (
                                    <div
                                        key={order.id}
                                        className="bg-card hover:bg-accent/40 border border-border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-md group relative"
                                        onClick={() => handleViewOS(order.id)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-primary font-mono font-bold text-sm">
                                                #{formatOSNumber(order.order_number, order.created_at)}
                                            </span>
                                            <div className={cn(
                                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                                                priorityCfg.color,
                                                "bg-transparent"
                                            )}>
                                                {priorityCfg.label}
                                            </div>
                                        </div>

                                        <h4 className="font-semibold text-foreground text-sm mb-1 truncate pr-6">
                                            {order.equipment || 'Equipamento não informado'}
                                        </h4>

                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                            <User className="w-3 h-3" />
                                            <span className="truncate">{order.client?.name || 'Cliente não informado'}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(new Date(order.created_at), 'dd/MM/yy')}</span>
                                            </div>
                                            <span className="font-bold text-foreground text-sm">
                                                R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <ChevronRight className="absolute right-2 top-11 w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
