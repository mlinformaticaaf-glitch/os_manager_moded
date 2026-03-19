import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import { formatSaleNumber } from '@/lib/saleUtils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sale, SALE_PAYMENT_STATUS_OPTIONS, SALE_PAYMENT_METHOD_OPTIONS } from '@/types/sale';
import { SalePrintButton } from './print/SalePrintButton';
import { SaleWhatsAppButton } from './whatsapp/SaleWhatsAppButton';

interface SaleViewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    onEdit?: (sale: Sale) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusBadge = (status: string) => {
    const option = SALE_PAYMENT_STATUS_OPTIONS.find(o => o.value === status);
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

export function SaleViewDialog({ open, onOpenChange, sale, onEdit }: SaleViewDialogProps) {
    if (!sale) return null;

    const paymentMethod = SALE_PAYMENT_METHOD_OPTIONS.find(o => o.value === sale.payment_method);

    const handleEdit = () => {
        if (onEdit) {
            onEdit(sale);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] w-full max-w-full sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-[85vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
                <div className="w-full sm:w-full mr-auto flex flex-col flex-1 h-full min-h-0 overflow-hidden">
                    <div className="shrink-0 p-4 sm:p-6 pb-0">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-8 min-w-0 gap-2">
                                <DialogTitle className="flex items-center gap-3 min-w-0">
                                    <span className="truncate">Venda #{formatSaleNumber(sale.sale_number, sale.created_at)}</span>
                                    {getStatusBadge(sale.payment_status)}
                                </DialogTitle>
                                {onEdit && (
                                    <Button variant="outline" size="sm" onClick={handleEdit}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                )}
                            </div>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 sm:p-6 space-y-6 w-full max-w-full min-w-0 overflow-hidden box-border">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <p className="font-medium truncate">{sale.client?.name || 'Venda Avulsa'}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground truncate">Data da Venda</p>
                                    <p className="font-medium truncate">
                                        {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground truncate">Vencimento</p>
                                    <p className="font-medium truncate">
                                        {sale.due_date
                                            ? format(new Date(sale.due_date), 'dd/MM/yyyy', { locale: ptBR })
                                            : '-'}
                                    </p>
                                </div>
                                {sale.payment_method && (
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                                        <p className="font-medium truncate">{paymentMethod?.label || sale.payment_method}</p>
                                    </div>
                                )}
                                {sale.paid_at && (
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground truncate">Data do Pagamento</p>
                                        <p className="font-medium truncate">
                                            {format(new Date(sale.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Itens */}
                            {sale.items && sale.items.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="font-medium mb-3">Itens da Venda</h4>
                                        <div className="space-y-2">
                                            {sale.items.map((item, index) => (
                                                <div
                                                    key={item.id || index}
                                                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md min-w-0 gap-2 overflow-hidden"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium break-words whitespace-pre-wrap leading-tight text-sm">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap mt-0.5">
                                                            {item.quantity} x {formatCurrency(item.unit_price)}
                                                        </p>
                                                    </div>
                                                    <p className="font-medium shrink-0">{formatCurrency(item.total)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Totais */}
                            <Separator />
                            <div className="space-y-2 w-full max-w-[250px] ml-auto min-w-0">
                                <div className="flex justify-between text-sm gap-2">
                                    <span className="text-muted-foreground truncate">Subtotal</span>
                                    <span className="shrink-0">{formatCurrency(sale.subtotal)}</span>
                                </div>
                                {sale.discount > 0 && (
                                    <div className="flex justify-between text-sm gap-2">
                                        <span className="text-muted-foreground truncate">Desconto</span>
                                        <span className="text-destructive shrink-0">-{formatCurrency(sale.discount)}</span>
                                    </div>
                                )}
                                {sale.shipping > 0 && (
                                    <div className="flex justify-between text-sm gap-2">
                                        <span className="text-muted-foreground truncate">Frete/Outros</span>
                                        <span className="shrink-0">{formatCurrency(sale.shipping)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-medium text-lg gap-2">
                                    <span className="truncate">Total</span>
                                    <span className="shrink-0 text-primary">{formatCurrency(sale.total)}</span>
                                </div>
                            </div>

                            {/* Observações */}
                            {sale.notes && (
                                <>
                                    <Separator />
                                    <div className="w-full min-w-0">
                                        <p className="text-sm text-muted-foreground mb-1">Observações</p>
                                        <p className="text-sm whitespace-pre-wrap break-words">{sale.notes}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="shrink-0 p-4 sm:p-6 pt-2 border-t flex flex-col sm:flex-row gap-2">
                        <div className="flex flex-1 gap-2">
                            <SalePrintButton sale={sale} items={sale.items || []} variant="outline" className="flex-1" />
                            <SaleWhatsAppButton sale={sale} items={sale.items || []} variant="outline" className="flex-1" />
                        </div>
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Fechar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
