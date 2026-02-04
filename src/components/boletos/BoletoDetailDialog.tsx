import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Calendar, DollarSign, Building2, Barcode } from 'lucide-react';
import { Boleto, BoletoPayment, BOLETO_STATUS_LABELS, BoletoStatus } from '@/types/boleto';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoletoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boleto: Boleto | null;
  payment?: BoletoPayment | null;
}

export function BoletoDetailDialog({
  open,
  onOpenChange,
  boleto,
  payment,
}: BoletoDetailDialogProps) {
  if (!boleto) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: BoletoStatus) => {
    const colors: Record<BoletoStatus, string> = {
      pending: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[status]}>
        {BOLETO_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Boleto</span>
            {getStatusBadge(boleto.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Emissor</p>
                <p className="font-medium">{boleto.issuer_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(Number(boleto.amount))}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="font-medium">
                  {format(parseISO(boleto.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {boleto.barcode && (
              <div className="flex items-start gap-3">
                <Barcode className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Linha Digitável</p>
                  <p className="font-mono text-sm break-all">{boleto.barcode}</p>
                </div>
              </div>
            )}

            {boleto.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm p-3 bg-muted rounded-lg">{boleto.notes}</p>
              </div>
            )}
          </div>

          {/* Files */}
          {(boleto.pdf_url || payment?.receipt_url) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Arquivos</p>
                <div className="flex flex-wrap gap-2">
                  {boleto.pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(boleto.pdf_url!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Boleto PDF
                    </Button>
                  )}
                  {payment?.receipt_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(payment.receipt_url!, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Comprovante
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Payment Info */}
          {payment && (
            <>
              <Separator />
              <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                <p className="font-medium text-primary">
                  Pagamento Registrado
                </p>
                <div className="text-sm space-y-1 text-foreground/80">
                  <p>
                    <strong>Data:</strong>{' '}
                    {format(parseISO(payment.paid_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <p>
                    <strong>Valor Pago:</strong>{' '}
                    {formatCurrency(Number(payment.amount_paid))}
                  </p>
                  {payment.payment_method && (
                    <p>
                      <strong>Forma:</strong> {payment.payment_method}
                    </p>
                  )}
                  {payment.notes && (
                    <p>
                      <strong>Obs:</strong> {payment.notes}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
