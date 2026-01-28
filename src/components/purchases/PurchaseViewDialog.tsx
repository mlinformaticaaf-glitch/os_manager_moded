import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Purchase, PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/types/purchase';

interface PurchaseViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusBadge = (status: string) => {
  const option = PAYMENT_STATUS_OPTIONS.find(o => o.value === status);
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    paid: 'default',
    partial: 'outline',
    cancelled: 'destructive',
  };
  
  return (
    <Badge variant={variants[status] || 'secondary'}>
      {option?.label || status}
    </Badge>
  );
};

export function PurchaseViewDialog({ open, onOpenChange, purchase }: PurchaseViewDialogProps) {
  if (!purchase) return null;

  const paymentMethod = PAYMENT_METHOD_OPTIONS.find(o => o.value === purchase.payment_method);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Compra #{purchase.purchase_number}</span>
            {getStatusBadge(purchase.payment_status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fornecedor</p>
              <p className="font-medium">{purchase.supplier?.name || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nota Fiscal</p>
              <p className="font-medium">{purchase.invoice_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data da Compra</p>
              <p className="font-medium">
                {format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencimento</p>
              <p className="font-medium">
                {purchase.due_date
                  ? format(new Date(purchase.due_date), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </p>
            </div>
            {purchase.payment_method && (
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">{paymentMethod?.label || purchase.payment_method}</p>
              </div>
            )}
            {purchase.paid_at && (
              <div>
                <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                <p className="font-medium">
                  {format(new Date(purchase.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          {/* Itens */}
          {purchase.items && purchase.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Itens da Compra</h4>
                <div className="space-y-2">
                  {purchase.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-medium ml-4">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Totais */}
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(purchase.subtotal)}</span>
            </div>
            {purchase.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-destructive">-{formatCurrency(purchase.discount)}</span>
              </div>
            )}
            {purchase.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatCurrency(purchase.shipping)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>{formatCurrency(purchase.total)}</span>
            </div>
          </div>

          {/* Observações */}
          {purchase.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{purchase.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
