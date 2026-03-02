import { useState } from "react";
import { ServiceOrder, ServiceOrderItem } from "@/types/serviceOrder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Bell, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import {
  formatWhatsAppMessage,
  formatWhatsAppStatusUpdate,
  formatWhatsAppPaymentReminder,
  openWhatsApp,
} from "./whatsappUtils";

interface OSWhatsAppButtonProps {
  order: ServiceOrder;
  items: ServiceOrderItem[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

type MessageType = 'full' | 'status' | 'payment';

export function OSWhatsAppButton({ order, items, variant = "outline", size = "sm" }: OSWhatsAppButtonProps) {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>('full');

  const hasClientPhone = order.client?.phone;
  const companyName = settings?.name || 'Assistência Técnica';
  const footerMessage = settings?.footer_message || 'Obrigado pela preferência!';
  const warrantyTerms = settings?.warranty_terms || undefined;

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

    setMessageType(type);
    setMessage(formattedMessage);
    setShowPreview(true);
  };

  const handleSend = () => {
    if (!order.client?.phone) {
      toast({
        title: "Telefone não encontrado",
        description: "O cliente não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    openWhatsApp(order.client.phone, message);
    setShowPreview(false);

    toast({
      title: "WhatsApp aberto",
      description: "A mensagem foi preparada. Clique em enviar no WhatsApp.",
    });
  };

  if (!hasClientPhone) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        title="Cliente sem telefone cadastrado"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="text-green-600 border-green-600 hover:bg-green-600/10">
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSelectMessageType('full')}>
            <FileText className="h-4 w-4 mr-2" />
            Enviar OS Completa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSelectMessageType('status')}>
            <Bell className="h-4 w-4 mr-2" />
            Atualização de Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectMessageType('payment')}>
            <CreditCard className="h-4 w-4 mr-2" />
            Lembrete de Pagamento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[500px] w-full max-w-full sm:w-[calc(100vw-16px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
          <div className="shrink-0 p-4 sm:p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Enviar via WhatsApp
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

          <DialogFooter className="shrink-0 p-4 sm:p-6 pt-2 border-t sm:border-t-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full sm:flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 w-full sm:flex-1">
              <Send className="h-4 w-4 mr-2" />
              Enviar no WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
