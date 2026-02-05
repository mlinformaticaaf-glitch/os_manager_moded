import { Bell, Package, ClipboardList, ShoppingCart, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'low_stock':
      return Package;
    case 'overdue_os':
      return ClipboardList;
    case 'overdue_purchase':
      return ShoppingCart;
    case 'overdue_financial':
      return DollarSign;
    default:
      return Bell;
  }
}

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const { notifications, count, isLoading } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to the route with state to open the specific record
    navigate(notification.route, { state: notification.state });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="font-semibold text-sm">Notificações</h3>
          <p className="text-xs text-muted-foreground">
            {count === 0 ? 'Nenhuma notificação' : `${count} pendência${count > 1 ? 's' : ''}`}
          </p>
        </div>
        
        {count === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Tudo em dia! 🎉
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="py-1">
              {notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div key={notification.id}>
                    {index > 0 && <DropdownMenuSeparator className="my-0" />}
                    <DropdownMenuItem
                      className="px-3 py-2.5 cursor-pointer focus:bg-accent"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          notification.severity === 'error' 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-orange-500/10 text-orange-500"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            notification.severity === 'error' ? "text-destructive" : "text-orange-600 dark:text-orange-400"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
