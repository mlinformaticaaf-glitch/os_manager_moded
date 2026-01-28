import { cn } from "@/lib/utils";
import { Clock, User, Loader2 } from "lucide-react";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { STATUS_CONFIG, OSStatus } from "@/types/serviceOrder";
import { formatOSNumber } from "@/lib/osUtils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

const KANBAN_COLUMNS: OSStatus[] = [
  'pending',
  'in_progress',
  'waiting_parts',
  'completed',
];

const prioridadeColors = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive"
};

const prioridadeLabels = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente"
};

export function KanbanBoard() {
  const { orders, isLoading } = useServiceOrders();
  const navigate = useNavigate();

  const getOrdersByStatus = (status: OSStatus) => {
    return orders.filter(order => order.status === status);
  };

  const handleViewOS = (orderId: string) => {
    navigate('/os', { state: { viewOrderId: orderId } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
      {KANBAN_COLUMNS.map((status) => {
        const statusOrders = getOrdersByStatus(status);
        const config = STATUS_CONFIG[status];

        return (
          <div key={status} className="kanban-column min-w-[260px] sm:min-w-[280px] flex-shrink-0 sm:flex-shrink snap-center sm:snap-align-none sm:flex-1">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full", config.bgColor.replace('-100', '-500').replace('-50', '-500'))} />
              <h3 className="font-semibold text-foreground text-xs sm:text-sm">{config.label}</h3>
              <span className="ml-auto bg-muted text-muted-foreground text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                {statusOrders.length}
              </span>
            </div>

            {/* Cards */}
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <div className="space-y-2 sm:space-y-3 pr-2">
                {statusOrders.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Nenhuma OS
                  </div>
                ) : (
                  statusOrders.map((order) => (
                    <div key={order.id} className="kanban-card group p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewOS(order.id)}>
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-primary font-mono font-semibold text-xs sm:text-sm">
                            #{formatOSNumber(order.order_number, order.created_at)}
                          </span>
                          <span className={cn(
                            "text-[9px] sm:text-[10px] uppercase font-semibold px-1 sm:px-1.5 py-0.5 rounded",
                            prioridadeColors[order.priority as keyof typeof prioridadeColors] || prioridadeColors.normal
                          )}>
                            {prioridadeLabels[order.priority as keyof typeof prioridadeLabels] || 'Normal'}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-medium text-foreground text-xs sm:text-sm mb-1">
                        {order.equipment || 'Equipamento não informado'}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {order.reported_issue}
                      </p>

                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{order.client?.name || 'Cliente não informado'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{format(new Date(order.created_at), 'dd/MM/yyyy')}</span>
                        </div>
                        <span className="font-semibold text-success text-xs sm:text-sm">
                          R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
