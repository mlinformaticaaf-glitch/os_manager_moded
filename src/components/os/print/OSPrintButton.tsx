import { ServiceOrder, ServiceOrderItem } from "@/types/serviceOrder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, FileText, Receipt, Copy, MessageCircle } from "lucide-react";
import { printOSA4, printOSA4Dual, printOSThermal, sendOSA4PDFToWhatsApp } from "./printOS";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useToast } from "@/hooks/use-toast";

interface OSPrintButtonProps {
  order: ServiceOrder;
  items: ServiceOrderItem[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function OSPrintButton({ order, items, variant = "outline", size = "sm" }: OSPrintButtonProps) {
  const { settings } = useCompanySettings();
  const { toast } = useToast();

  const handlePrint = async (type: 'a4' | 'a4-dual' | 'thermal' | 'whatsapp') => {
    const printData = {
      order,
      items,
      companyName: settings?.name || 'Assistência Técnica',
      companyPhone: settings?.phone || undefined,
      companyAddress: settings?.address 
        ? `${settings.address}${settings.city ? `, ${settings.city}` : ''}${settings.state ? ` - ${settings.state}` : ''}`
        : undefined,
      companyEmail: settings?.email || undefined,
      companyDocument: settings?.document || undefined,
      logoUrl: settings?.logo_url || undefined,
      warrantyTerms: settings?.warranty_terms || undefined,
      footerMessage: settings?.footer_message || 'Obrigado pela preferência!',
    };

    if (type === 'a4') {
      printOSA4(printData);
    } else if (type === 'a4-dual') {
      printOSA4Dual(printData);
    } else if (type === 'whatsapp') {
      if (!order.client?.phone) {
        toast({
          title: 'Telefone não encontrado',
          description: 'Cadastre o telefone do cliente para enviar via WhatsApp.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await sendOSA4PDFToWhatsApp(printData, order.client.phone);
        toast({
          title: 'Envio iniciado',
          description: 'PDF preparado para envio no WhatsApp.',
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Erro ao enviar PDF no WhatsApp:', error);
        toast({
          title: 'Falha ao enviar PDF',
          description: 'Não foi possível preparar o envio via WhatsApp.',
          variant: 'destructive',
        });
      }
    } else {
      printOSThermal(printData);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void handlePrint('a4')}>
          <FileText className="h-4 w-4 mr-2" />
          A4 - Uma via
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handlePrint('a4-dual')}>
          <Copy className="h-4 w-4 mr-2" />
          A4 - Duas Vias
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handlePrint('thermal')}>
          <Receipt className="h-4 w-4 mr-2" />
          Térmica (58mm)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handlePrint('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Enviar PDF no WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
