import { useServiceOrderLogs } from "@/hooks/useServiceOrders";
import { useStatusSettings } from "@/hooks/useStatusSettings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OSStatusHistoryProps {
    orderId: string;
}

export function OSStatusHistory({ orderId }: OSStatusHistoryProps) {
    const { data: logs, isLoading } = useServiceOrderLogs(orderId);
    const { getStatusConfig } = useStatusSettings();

    if (isLoading) return <div className="text-sm text-muted-foreground">Carregando histórico...</div>;
    if (!logs || logs.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Status
            </h3>
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:-translate-x-1/2 before:bg-border">
                {logs.map((log) => {
                    const oldStatus = log.old_status ? getStatusConfig(log.old_status) : null;
                    const newStatus = getStatusConfig(log.new_status);

                    return (
                        <div key={log.id} className="relative pl-8">
                            <div className="absolute left-0 mt-1.5 h-5 w-5 rounded-full border-4 border-background bg-primary shadow-sm" />
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {oldStatus ? (
                                        <>
                                            <Badge variant="outline" className={cn("text-[10px] px-1.5 h-5", oldStatus.color, oldStatus.bgColor)}>
                                                {oldStatus.label}
                                            </Badge>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Inicializado como</span>
                                    )}
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 h-5", newStatus.color, newStatus.bgColor)}>
                                        {newStatus.label}
                                    </Badge>
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                                {log.notes && (
                                    <p className="text-xs mt-1 text-muted-foreground italic">"{log.notes}"</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
