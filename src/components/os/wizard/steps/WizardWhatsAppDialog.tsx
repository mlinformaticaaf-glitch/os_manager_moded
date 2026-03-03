import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Bell, CreditCard, FileText } from 'lucide-react';
import { ServiceOrder, ServiceOrderItem } from '@/types/serviceOrder';
import {
  formatWhatsAppMessage,
  formatWhatsAppStatusUpdate,
  formatWhatsAppPaymentReminder,
  openWhatsApp,
} from '@/components/os/whatsapp/whatsappUtils';

interface WizardWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder;
  items: ServiceOrderItem[];
  companyName: string;
  footerMessage: string;
  warrantyTerms?: string;
}

type MessageType = 'full' | 'status' | 'payment';

export function WizardWhatsAppDialog({
  open,
  onOpenChange,
  order,
  items,
  companyName,
  footerMessage,
  warrantyTerms,
}: WizardWhatsAppDialogProps) {
  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [message, setMessage] = useState('');

  const handleSelectMessageType = (type: MessageType) => {
    let formattedMessage = '';

    switch (type) {
      case 'full':
        formattedMessage = formatWhatsAppMessage({ order, items, companyName, footerMessage, warrantyTerms });
        break;
      case 'status':
        formattedMessage = formatWhatsAppStatusUpdate({ order, companyName });
        break;
      case 'payment':
        formattedMessage = formatWhatsAppPaymentReminder({ order, companyName });
        break;
    }

    setMessage(formattedMessage);
    setStep('preview');
  };

  const handleSend = () => {
    if (!order.client?.phone) return;
    openWhatsApp(order.client.phone, message);
    onOpenChange(false);
    setStep('select');
    setMessage('');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('select');
      setMessage('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] w-full max-w-full sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-[85vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        {step === 'select' ? (
          <>
            <div className="shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Enviar via WhatsApp
                </DialogTitle>
                <DialogDescription>
                  Escolha o tipo de mensagem para enviar ao cliente
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6">
                <div className="grid gap-3 py-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start gap-3 w-full"
                    onClick={() => handleSelectMessageType('full')}
                  >
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">Enviar OS Completa</p>
                      <p className="text-sm text-muted-foreground">
                        Detalhes do equipamento, serviços e valores
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start gap-3 w-full"
                    onClick={() => handleSelectMessageType('status')}
                  >
                    <Bell className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">Atualização de Status</p>
                      <p className="text-sm text-muted-foreground">
                        Informar o cliente sobre o andamento
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start gap-3 w-full"
                    onClick={() => handleSelectMessageType('payment')}
                  >
                    <CreditCard className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">Lembrete de Pagamento</p>
                      <p className="text-sm text-muted-foreground">
                        Lembrar sobre pagamento pendente
                      </p>
                    </div>
                  </Button>
                </div>
              </div>
            </ScrollArea>
            <div className="shrink-0 p-4 sm:p-6 pt-0 border-t sm:border-t-0 flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Revisar Mensagem
                </DialogTitle>
                <DialogDescription>
                  Revise e edite a mensagem antes de enviar para {order.client?.name}
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Para:</span>
                  <span className="font-medium text-foreground">{order.client?.phone}</span>
                </div>

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Digite a mensagem..."
                />
              </div>
            </ScrollArea>

            <div className="shrink-0 p-4 sm:p-6 pt-2 border-t sm:border-t-0 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="w-full sm:flex-1">
                Voltar
              </Button>
              <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 w-full sm:flex-1">
                <Send className="h-4 w-4 mr-2" />
                Enviar no WhatsApp
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
