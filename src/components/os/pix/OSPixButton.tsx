import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ServiceOrder } from "@/types/serviceOrder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { QrCode, Copy, Check, AlertCircle, Settings } from "lucide-react";
import { generatePixPayload, formatPixKey } from "./pixUtils";
import { useNavigate } from "react-router-dom";
import { formatOSNumber } from "@/lib/osUtils";

interface OSPixButtonProps {
  order: ServiceOrder;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function OSPixButton({ order, variant = "outline", size = "sm" }: OSPixButtonProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useCompanySettings();
  const [showPixModal, setShowPixModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(order.total);

  const hasPixKey = settings?.pix_key && settings?.pix_key_type;

  const generatePayload = () => {
    if (!settings?.pix_key || !settings?.pix_key_type) return null;

    return generatePixPayload({
      pixKey: settings.pix_key,
      pixKeyType: settings.pix_key_type as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
      beneficiaryName: settings.pix_beneficiary || settings.name || 'Assistencia Tecnica',
      beneficiaryCity: settings.city || 'SAO PAULO',
      amount: customAmount,
      transactionId: `OS${formatOSNumber(order.order_number, order.created_at)}`,
      description: `OS ${formatOSNumber(order.order_number, order.created_at)}`,
    });
  };

  const pixPayload = showPixModal ? generatePayload() : null;

  const handleCopyPayload = async () => {
    if (!pixPayload) return;

    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole o código Pix no app do seu banco.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenModal = () => {
    setCustomAmount(order.total);
    setShowPixModal(true);
  };

  if (!hasPixKey) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => navigate('/configuracoes')}
        className="text-purple-600 border-purple-600 hover:bg-purple-600/10"
        title="Configure sua chave Pix"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Pix
        <AlertCircle className="h-3 w-3 ml-1" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
        className="text-purple-600 border-purple-600 hover:bg-purple-600/10"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Pix
      </Button>

      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="sm:max-w-[420px] w-full max-w-full sm:w-[calc(100vw-16px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
          <div className="shrink-0 p-4 sm:p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                Pagamento via Pix
              </DialogTitle>
              <DialogDescription>
                OS #{formatOSNumber(order.order_number, order.created_at)} - {order.client?.name || 'Cliente'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Pagamento</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                    className="text-lg font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomAmount(order.total)}
                    className="whitespace-nowrap"
                  >
                    {formatCurrency(order.total)}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {pixPayload && customAmount > 0 && (
                <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
                  <QRCodeSVG
                    value={pixPayload}
                    size={200}
                    level="M"
                    includeMargin
                    className="rounded"
                  />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(customAmount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {settings?.pix_beneficiary || settings?.name}
                    </p>
                  </div>
                </div>
              )}

              {customAmount <= 0 && (
                <div className="flex flex-col items-center gap-2 p-6 bg-muted rounded-lg">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Informe um valor maior que zero
                  </p>
                </div>
              )}

              {/* Pix Key Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Chave Pix: {formatPixKey(settings?.pix_key || '', settings?.pix_key_type || '')}</p>
              </div>

              {/* Copy Button */}
              {pixPayload && customAmount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleCopyPayload}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-success" />
                      Código Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Pix Copia e Cola
                    </>
                  )}
                </Button>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 p-4 sm:p-6 pt-2 border-t sm:border-t-0 flex flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/configuracoes')}
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Pix
            </Button>
            <Button variant="outline" onClick={() => setShowPixModal(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
