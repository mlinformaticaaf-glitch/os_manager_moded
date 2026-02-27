import { ServiceOrder, OSStatus } from '@/types/serviceOrder';
import { OSCard } from './OSCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStatusSettings } from '@/hooks/useStatusSettings';

interface OSKanbanViewProps {
  orders: ServiceOrder[];
  onView: (order: ServiceOrder) => void;
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
  onStatusChange: (orderId: string, status: OSStatus) => void;
}

const KANBAN_COLUMNS: OSStatus[] = [
  'pending',
  'in_progress',
  'waiting_parts',
  'waiting_approval',
  'completed',
  'delivered',
];

export function OSKanbanView({ orders, onView, onEdit, onDelete, onStatusChange }: OSKanbanViewProps) {
  const { statusConfig, orderedStatuses } = useStatusSettings();

  const getOrdersByStatus = (status: OSStatus) => {
    return orders.filter(order => order.status === status);
  };

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
      {orderedStatuses.filter(s => KANBAN_COLUMNS.includes(s)).map((status) => {
        const statusOrders = getOrdersByStatus(status);
        const config = statusConfig[status];

        return (
          <div
            key={status}
            className="flex-shrink-0 w-[280px] sm:w-[300px] bg-muted/30 rounded-lg border border-border snap-start"
          >
            <div className={cn("px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border flex items-center justify-between")}>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", config.bgColor.replace('bg-', 'bg-').replace('-100', '-500'))} />
                <span className="font-medium text-xs sm:text-sm">{config.label}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {statusOrders.length}
              </span>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)]">
              <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                {statusOrders.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
                    Nenhuma OS
                  </p>
                ) : (
                  statusOrders.map((order) => (
                    <OSCard
                      key={order.id}
                      order={order}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
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
