import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const recentOS = [
  { numero: "0005/2026", cliente: "Carlos Pereira", status: "concluido", valor: 320 },
  { numero: "0004/2026", cliente: "Ana Oliveira", status: "aguardando", valor: 650 },
  { numero: "0003/2026", cliente: "Pedro Costa", status: "andamento", valor: 200 },
  { numero: "0002/2026", cliente: "Maria Santos", status: "pendente", valor: 180 },
  { numero: "0001/2026", cliente: "João Silva", status: "pendente", valor: 450 },
];

const statusStyles = {
  pendente: "badge-pending",
  andamento: "badge-progress",
  aguardando: "bg-purple-500/15 text-purple-400",
  concluido: "badge-completed"
};

const statusLabels = {
  pendente: "Pendente",
  andamento: "Em Andamento",
  aguardando: "Aguard. Peças",
  concluido: "Concluído"
};

export function RecentOS() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Últimas OS</h3>
        <button className="flex items-center gap-1 text-[10px] sm:text-xs text-primary hover:underline">
          Ver todas <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {recentOS.map((os) => (
          <div 
            key={os.numero}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer gap-2"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-primary font-mono text-xs sm:text-sm font-medium shrink-0">
                #{os.numero}
              </span>
              <span className="text-foreground text-xs sm:text-sm truncate">{os.cliente}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <span className={cn("badge-status text-[10px] sm:text-xs px-2 py-0.5", statusStyles[os.status as keyof typeof statusStyles])}>
                {statusLabels[os.status as keyof typeof statusLabels]}
              </span>
              <span className="text-foreground font-medium text-xs sm:text-sm whitespace-nowrap">
                R$ {os.valor}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
