import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { STATUS_CONFIG } from "@/types/serviceOrder";
import { formatOSNumber } from "@/lib/osUtils";
import { useNavigate } from "react-router-dom";

export function RecentOS() {
  const { orders, isLoading } = useServiceOrders();
  const navigate = useNavigate();

  // Get the 5 most recent orders
  const recentOrders = orders.slice(0, 5);

  const handleViewAll = () => {
    navigate('/os');
  };

  const handleViewOS = (orderId: string) => {
    navigate('/os', { state: { viewOrderId: orderId } });
  };

  if (isLoading) {
    return (
      <div className="stat-card flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Últimas OS</h3>
        <button 
          onClick={handleViewAll}
          className="flex items-center gap-1 text-[10px] sm:text-xs text-primary hover:underline"
        >
          Ver todas <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      
      {recentOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma OS cadastrada
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {recentOrders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            return (
              <div 
                key={order.id}
                onClick={() => handleViewOS(order.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-primary font-mono text-xs sm:text-sm font-medium shrink-0">
                    #{formatOSNumber(order.order_number, order.created_at)}
                  </span>
                  <span className="text-foreground text-xs sm:text-sm truncate">
                    {order.client?.name || 'Cliente não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  <span className={cn(
                    "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium whitespace-nowrap max-w-[80px] sm:max-w-none truncate text-center",
                    config.bgColor,
                    config.color
                  )}>
                    <span className="sm:hidden">{config.shortLabel}</span>
                    <span className="hidden sm:inline">{config.label}</span>
                  </span>
                  <span className="text-foreground font-medium text-xs sm:text-sm whitespace-nowrap">
                    R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
