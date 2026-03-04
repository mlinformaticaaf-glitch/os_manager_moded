import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WizardFormData, WizardItemData } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG, OSDefaultStatus } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { useClients } from '@/hooks/useClients';
import { useEquipment } from '@/hooks/useEquipment';
import { formatEquipmentCode } from '@/types/equipment';
import { cn } from '@/lib/utils';
import {
  User,
  Monitor,
  AlertCircle,
  Wrench,
  Package,
  ArrowLeft,
  Loader2,
  Check,
  Printer,
  MessageCircle,
} from 'lucide-react';

interface SummaryStepProps {
  formData: WizardFormData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  createdOrderId?: string | null;
  onPrint?: () => void;
  onWhatsApp?: () => void;
}

export function SummaryStep({
  formData,
  onBack,
  onSubmit,
  isSubmitting,
  createdOrderId,
  onPrint,
  onWhatsApp,
}: SummaryStepProps) {
  const { clients } = useClients();
  const { equipment: equipmentList } = useEquipment();
  const { getStatusConfig } = useStatusSettings();

  const selectedClient = clients.find((c) => c.id === formData.client_id);
  const selectedEquipment = equipmentList.find((e) => e.id === formData.equipment_id);

  const statusConfig = getStatusConfig(formData.status);
  const priorityConfig = PRIORITY_CONFIG[formData.priority];

  const totalServices = formData.items
    .filter((i) => i.type === 'service')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const totalProducts = formData.items
    .filter((i) => i.type === 'product')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const total = Math.max(0, totalServices + totalProducts - formData.discount);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Success state
  if (createdOrderId) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-green-600">OS Criada!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ordem de serviço registrada
          </p>
        </div>

        <Card className="border-green-200">
          <CardContent className="p-4 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-16 flex items-center justify-center gap-3 border-2 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onPrint?.();
                }}
              >
                <Printer className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-bold text-sm">Imprimir OS</p>
                  <p className="text-xs text-muted-foreground">Formato A4</p>
                </div>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-16 flex items-center justify-center gap-3 border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onWhatsApp?.();
                }}
                disabled={!selectedClient?.phone}
              >
                <MessageCircle className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-bold text-sm">Enviar WhatsApp</p>
                  <p className="text-xs text-green-600/70">{selectedClient?.phone || 'Sem telefone'}</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Resumo da OS</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Revise antes de finalizar</p>
      </div>

      {/* Client */}
      <Card>
        <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 sm:py-3 pt-0 px-3 sm:px-6">
          {selectedClient ? (
            <div>
              <p className="font-semibold text-sm sm:text-base">{selectedClient.name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedClient.phone || selectedClient.email || 'Sem contato'}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">Cliente não informado</p>
          )}
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 sm:py-3 pt-0 px-3 sm:px-6">
          {selectedEquipment ? (
            <div>
              <p className="font-semibold text-sm sm:text-base">{selectedEquipment.description}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatEquipmentCode(selectedEquipment.code)}
                {formData.serial_number && ` • S/N: ${formData.serial_number}`}
              </p>
              {formData.accessories && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Acessórios: {formData.accessories}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">Equipamento não informado</p>
          )}
        </CardContent>
      </Card>

      {/* Problem */}
      <Card>
        <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Problema
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 sm:py-3 pt-0 px-3 sm:px-6 space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm">{formData.reported_issue}</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className={cn(statusConfig.bgColor, "text-[10px] sm:text-xs")}>
              <span className={statusConfig.color}>{statusConfig.label}</span>
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              <span className={priorityConfig.color}>{priorityConfig.label}</span>
            </Badge>
            {formData.estimated_completion && (
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                {new Date(formData.estimated_completion + 'T00:00:00').toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {formData.items.length > 0 && (
        <Card>
          <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Serviços e Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 sm:py-3 pt-0 px-3 sm:px-6">
            <div className="space-y-1.5 sm:space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  {item.type === 'service' ? (
                    <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                  ) : (
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{item.description}</span>
                  <span className="text-muted-foreground shrink-0">x{item.quantity}</span>
                  <span className="font-medium shrink-0">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-2 sm:my-3" />
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviços:</span>
                <span>{formatCurrency(totalServices)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produtos:</span>
                <span>{formatCurrency(totalProducts)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(formData.discount)}</span>
                </div>
              )}
              <Separator className="my-1.5 sm:my-2" />
              <div className="flex justify-between font-semibold text-sm sm:text-base">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t mt-4">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isSubmitting} className="h-11 sm:h-9">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          size="lg"
          className="sm:size-default h-12 sm:h-10 font-bold bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Finalizar e Criar OS
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
