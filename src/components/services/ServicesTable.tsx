import { Wrench, MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Service } from '@/types/service';
import { useIsMobile } from '@/hooks/use-mobile';

interface ServicesTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getProfitMargin = (cost: number, sale: number) => {
  if (cost <= 0) return 0;
  return ((sale - cost) / cost) * 100;
};

function ServiceCard({ service, onEdit, onDelete }: { service: Service; onEdit: (service: Service) => void; onDelete: (service: Service) => void }) {
  const margin = getProfitMargin(service.cost_price, service.sale_price);

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onEdit(service)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{service.name}</p>
              <Badge variant={service.active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                {service.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {service.code && (
              <p className="text-xs text-muted-foreground mt-0.5">Código: {service.code}</p>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border">
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(service)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Preço</p>
          <p className="font-medium">{formatCurrency(service.sale_price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Margem</p>
          <p className={margin >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {margin.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tempo</p>
          {service.estimated_time ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{service.estimated_time}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ServicesTable({ services, onEdit, onDelete }: ServicesTableProps) {
  const isMobile = useIsMobile();

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Wrench className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum serviço encontrado</p>
        <p className="text-sm">Cadastre seu primeiro serviço clicando no botão acima</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead className="hidden lg:table-cell">Código</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead className="text-right hidden lg:table-cell">Custo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right hidden md:table-cell">Margem</TableHead>
            <TableHead className="text-center hidden md:table-cell">Tempo</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const margin = getProfitMargin(service.cost_price, service.sale_price);
            return (
              <TableRow 
                key={service.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEdit(service)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] hidden md:block">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {service.code || '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {service.category ? (
                    <Badge variant="outline">{service.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell">
                  {formatCurrency(service.cost_price)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(service.sale_price)}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {margin.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {service.estimated_time ? (
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">{service.estimated_time}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">
                  <Badge variant={service.active ? 'default' : 'secondary'}>
                    {service.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border border-border">
                      <DropdownMenuItem onClick={() => onEdit(service)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(service)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
