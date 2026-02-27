import { ServiceOrder, PRIORITY_CONFIG } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Pencil, Phone, Mail, MapPin, User, Calendar, Package, Wrench } from 'lucide-react';
import { OSStatus } from '@/types/serviceOrder';
import { ServiceOrderItem } from '@/types/serviceOrder';
import { OSPrintButton } from './print/OSPrintButton';
import { OSWhatsAppButton } from './whatsapp/OSWhatsAppButton';
import { OSPixButton } from './pix/OSPixButton';
import { formatOSNumber } from '@/lib/osUtils';

interface OSDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder | null;
  items: ServiceOrderItem[];
  onEdit: () => void;
  onStatusChange: (status: OSStatus) => void;
}

export function OSDetailView({
  open,
  onOpenChange,
  order,
  items,
  onEdit,
  onStatusChange,
}: OSDetailViewProps) {
  const { statusConfig, orderedStatuses, getStatusConfig } = useStatusSettings();

  if (!order) return null;

  const statusCfg = getStatusConfig(order.status);
  const priorityConfig = PRIORITY_CONFIG[order.priority];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-bold">OS #{formatOSNumber(order.order_number, order.created_at)}</span>
              <Badge className={cn('text-xs', priorityConfig.color, 'bg-transparent border')}>
                {priorityConfig.label}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <OSPixButton order={order} />
              <OSWhatsAppButton order={order} items={items} />
              <OSPrintButton order={order} items={items} />
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
          <DialogDescription>
            Detalhes completos da ordem de serviço
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={order.status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {orderedStatuses.map((key) => (
                    <SelectItem key={key} value={key}>
                      {statusConfig[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            {order.client && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h3>
                <p className="font-medium text-lg">{order.client.name}</p>
                {order.client.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3" />
                    {order.client.phone}
                  </p>
                )}
                {order.client.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {order.client.email}
                  </p>
                )}
              </div>
            )}

            {/* Equipment */}
            {order.equipment && (
              <div>
                <h3 className="font-semibold mb-2">Equipamento</h3>
                <p className="font-medium">
                  {order.equipment}
                  {order.brand && ` - ${order.brand}`}
                  {order.model && ` ${order.model}`}
                </p>
                {order.serial_number && (
                  <p className="text-sm text-muted-foreground">S/N: {order.serial_number}</p>
                )}
                {order.accessories && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Acessórios: {order.accessories}
                  </p>
                )}
              </div>
            )}

            <Separator />

            {/* Problem */}
            <div>
              <h3 className="font-semibold mb-2">Problema Relatado</h3>
              <p className="text-muted-foreground">{order.reported_issue}</p>
            </div>

            {order.diagnosis && (
              <div>
                <h3 className="font-semibold mb-2">Diagnóstico</h3>
                <p className="text-muted-foreground">{order.diagnosis}</p>
              </div>
            )}

            {order.solution && (
              <div>
                <h3 className="font-semibold mb-2">Solução Aplicada</h3>
                <p className="text-muted-foreground">{order.solution}</p>
              </div>
            )}

            <Separator />

            {/* Items */}
            {(services.length > 0 || products.length > 0) && (
              <div className="space-y-4">
                {services.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Serviços
                    </h3>
                    <div className="space-y-2">
                      {services.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.description}
                          </span>
                          <span className="font-medium">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {products.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produtos
                    </h3>
                    <div className="space-y-2">
                      {products.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.description}
                          </span>
                          <span className="font-medium">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span>{formatCurrency(order.total_services)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>{formatCurrency(order.total_products)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              {order.payment_method && (
                <p className="text-sm text-muted-foreground">
                  Pagamento: {order.payment_method === 'pix' ? 'PIX' : 
                    order.payment_method === 'cash' ? 'Dinheiro' :
                    order.payment_method === 'credit' ? 'Cartão Crédito' :
                    order.payment_method === 'debit' ? 'Cartão Débito' :
                    order.payment_method === 'promissory' ? 'Promissória' : order.payment_method}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Criado em: {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {order.estimated_completion && (
                <p>Previsão: {format(new Date(order.estimated_completion), "dd/MM/yyyy", { locale: ptBR })}</p>
              )}
              {order.completed_at && (
                <p>Concluído em: {format(new Date(order.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
              {order.delivered_at && (
                <p>Entregue em: {format(new Date(order.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
            </div>

            {order.internal_notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2 text-orange-600">Observações Internas</h3>
                  <p className="text-sm text-muted-foreground">{order.internal_notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
