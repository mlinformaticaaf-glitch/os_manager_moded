import { cn } from "@/lib/utils";
import { Clock, User, Phone, MoreVertical } from "lucide-react";

interface OS {
  id: string;
  numero: string;
  cliente: string;
  telefone: string;
  equipamento: string;
  problema: string;
  valor: number;
  data: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
}

interface Column {
  id: string;
  title: string;
  color: string;
  items: OS[];
}

const columns: Column[] = [
  {
    id: "pendente",
    title: "Pendente",
    color: "bg-warning",
    items: [
      {
        id: "1",
        numero: "0001/2026",
        cliente: "João Silva",
        telefone: "(11) 99999-1234",
        equipamento: "iPhone 14 Pro",
        problema: "Tela quebrada",
        valor: 450,
        data: "24/01/2026",
        prioridade: "alta"
      },
      {
        id: "2",
        numero: "0002/2026",
        cliente: "Maria Santos",
        telefone: "(11) 98888-5678",
        equipamento: "Samsung S23",
        problema: "Não carrega",
        valor: 180,
        data: "24/01/2026",
        prioridade: "media"
      }
    ]
  },
  {
    id: "em_andamento",
    title: "Em Andamento",
    color: "bg-info",
    items: [
      {
        id: "3",
        numero: "0003/2026",
        cliente: "Pedro Costa",
        telefone: "(11) 97777-9012",
        equipamento: "Notebook Dell",
        problema: "Lentidão",
        valor: 200,
        data: "23/01/2026",
        prioridade: "baixa"
      }
    ]
  },
  {
    id: "aguardando_pecas",
    title: "Aguardando Peças",
    color: "bg-purple-500",
    items: [
      {
        id: "4",
        numero: "0004/2026",
        cliente: "Ana Oliveira",
        telefone: "(11) 96666-3456",
        equipamento: "MacBook Pro",
        problema: "Bateria viciada",
        valor: 650,
        data: "22/01/2026",
        prioridade: "media"
      }
    ]
  },
  {
    id: "concluido",
    title: "Concluído",
    color: "bg-success",
    items: [
      {
        id: "5",
        numero: "0005/2026",
        cliente: "Carlos Pereira",
        telefone: "(11) 95555-7890",
        equipamento: "iPad Air",
        problema: "Touchscreen",
        valor: 320,
        data: "21/01/2026",
        prioridade: "baixa"
      }
    ]
  }
];

const prioridadeColors = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-info/15 text-info",
  alta: "bg-warning/15 text-warning",
  urgente: "bg-destructive/15 text-destructive"
};

export function KanbanBoard() {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
      {columns.map((column) => (
        <div key={column.id} className="kanban-column min-w-[260px] sm:min-w-[280px] flex-shrink-0 sm:flex-shrink snap-center sm:snap-align-none sm:flex-1">
          {/* Column Header */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full", column.color)} />
            <h3 className="font-semibold text-foreground text-xs sm:text-sm">{column.title}</h3>
            <span className="ml-auto bg-muted text-muted-foreground text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
              {column.items.length}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2 sm:space-y-3">
            {column.items.map((os) => (
              <div key={os.id} className="kanban-card group p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-primary font-mono font-semibold text-xs sm:text-sm">
                      #{os.numero}
                    </span>
                    <span className={cn(
                      "text-[9px] sm:text-[10px] uppercase font-semibold px-1 sm:px-1.5 py-0.5 rounded",
                      prioridadeColors[os.prioridade]
                    )}>
                      {os.prioridade}
                    </span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-0.5 sm:p-1 hover:bg-muted rounded transition-all">
                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </button>
                </div>

                <h4 className="font-medium text-foreground text-xs sm:text-sm mb-1">
                  {os.equipamento}
                </h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                  {os.problema}
                </p>

                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="truncate">{os.cliente}</span>
                </div>

                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{os.data}</span>
                  </div>
                  <span className="font-semibold text-success text-xs sm:text-sm">
                    R$ {os.valor.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
