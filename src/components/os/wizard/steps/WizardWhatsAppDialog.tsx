import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
      <DialogContent className="sm:max-w-[500px]">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Enviar via WhatsApp
              </DialogTitle>
              <DialogDescription>
                Escolha o tipo de mensagem para enviar ao cliente
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start gap-3"
                onClick={() => handleSelectMessageType('full')}
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Enviar OS Completa</p>
                  <p className="text-sm text-muted-foreground">
                    Detalhes do equipamento, serviços e valores
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start gap-3"
                onClick={() => handleSelectMessageType('status')}
              >
                <Bell className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Atualização de Status</p>
                  <p className="text-sm text-muted-foreground">
                    Informar o cliente sobre o andamento
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start gap-3"
                onClick={() => handleSelectMessageType('payment')}
              >
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Lembrete de Pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Lembrar sobre pagamento pendente
                  </p>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Revisar Mensagem
              </DialogTitle>
              <DialogDescription>
                Revise e edite a mensagem antes de enviar para {order.client?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('select')}>
                Voltar
              </Button>
              <Button onClick={handleSend} className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4 mr-2" />
                Enviar no WhatsApp
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
