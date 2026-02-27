import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useStatusSettings } from "@/hooks/useStatusSettings";
import { formatOSNumber } from "@/lib/osUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DashboardOSList() {
  const { orders, isLoading } = useServiceOrders();
  const { statusConfig } = useStatusSettings();
  const navigate = useNavigate();

  // Only show open orders (not completed, delivered, or cancelled)
  const activeOrders = orders.filter(os => 
    !['completed', 'delivered', 'cancelled'].includes(os.status)
  );

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

  if (activeOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma OS ativa no momento
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {activeOrders.map((order) => {
          const statusConfig2 = statusConfig[order.status];
          return (
            <div
              key={order.id}
              onClick={() => handleViewOS(order.id)}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer gap-2 border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-primary font-mono text-sm font-semibold shrink-0">
                  #{formatOSNumber(order.order_number, order.created_at)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm truncate font-medium">
                    {order.client?.name || 'Cliente não informado'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.equipment || 'Equipamento não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className={cn(
                  "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                  statusConfig2.bgColor,
                  statusConfig2.color
                )}>
                  {statusConfig2.shortLabel}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(order.created_at), "dd/MM", { locale: ptBR })}
                </span>
                <span className="text-foreground font-semibold text-sm whitespace-nowrap">
                  R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
