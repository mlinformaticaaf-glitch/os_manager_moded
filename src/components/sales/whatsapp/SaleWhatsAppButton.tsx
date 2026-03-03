import { useState } from "react";
import { Sale, SaleItem } from "@/types/sale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { MessageCircle, Send, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import {
    formatSaleWhatsAppMessage,
    openSaleWhatsApp,
} from "./saleWhatsAppUtils";

interface SaleWhatsAppButtonProps {
    sale: Sale;
    items: SaleItem[];
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "icon";
    className?: string;
}

export function SaleWhatsAppButton({ sale, items, variant = "outline", size = "sm", className }: SaleWhatsAppButtonProps) {
    const { toast } = useToast();
    const { settings } = useCompanySettings();
    const [showPreview, setShowPreview] = useState(false);
    const [message, setMessage] = useState("");

    const hasClientPhone = sale.client?.phone;
    const companyName = settings?.name || 'Sistema de Vendas';
    const footerMessage = settings?.footer_message || 'Obrigado pela preferência!';

    const handleOpenPreview = () => {
        const formattedMessage = formatSaleWhatsAppMessage({ sale, items, companyName, footerMessage });
        setMessage(formattedMessage);
        setShowPreview(true);
    };

    const handleSend = () => {
        if (!sale.client?.phone) {
            toast({
                title: "Telefone não encontrado",
                description: "O cliente não possui telefone cadastrado.",
                variant: "destructive",
            });
            return;
        }

        openSaleWhatsApp(sale.client.phone, message);
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
                className={cn("text-muted-foreground", className)}
                title="Cliente sem telefone cadastrado"
            >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
            </Button>
        );
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleOpenPreview}
                className={cn("text-green-600 border-green-600 hover:bg-green-600/10", className)}
            >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
            </Button>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-[500px] w-full max-w-full sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-[85vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
                    <div className="shrink-0 p-4 sm:p-6 pb-0">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-green-600" />
                                Enviar via WhatsApp
                            </DialogTitle>
                            <DialogDescription>
                                Revise o comprovante antes de enviar para {sale.client?.name}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 sm:p-6 space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Para:</span>
                                <span className="font-medium text-foreground">{sale.client?.phone}</span>
                            </div>

                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="min-h-[300px] font-mono text-sm resize-none"
                                placeholder="Digite a mensagem..."
                            />
                        </div>
                    </ScrollArea>

                    <DialogFooter className="shrink-0 p-4 sm:p-6 pt-2 border-t flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full sm:flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 w-full sm:flex-1">
                            <Send className="h-4 w-4 mr-2" />
                            Enviar agora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
