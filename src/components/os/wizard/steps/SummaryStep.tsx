import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WizardFormData, WizardItemData } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/serviceOrder';
import { useClients } from '@/hooks/useClients';
import { useEquipment } from '@/hooks/useEquipment';
import { formatEquipmentCode } from '@/types/equipment';
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

  const selectedClient = clients.find((c) => c.id === formData.client_id);
  const selectedEquipment = equipmentList.find((e) => e.id === formData.equipment_id);

  const statusConfig = STATUS_CONFIG[formData.status];
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
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600">OS Criada com Sucesso!</h2>
          <p className="text-muted-foreground">
            A ordem de serviço foi registrada no sistema
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col gap-2"
                onClick={onPrint}
              >
                <Printer className="h-6 w-6" />
                <span>Imprimir OS</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col gap-2 text-green-600 border-green-600 hover:bg-green-50"
                onClick={onWhatsApp}
                disabled={!selectedClient?.phone}
              >
                <MessageCircle className="h-6 w-6" />
                <span>Enviar WhatsApp</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Resumo da OS</h2>
        <p className="text-muted-foreground">Revise os dados antes de finalizar</p>
      </div>

      {/* Client */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 pt-0">
          {selectedClient ? (
            <div>
              <p className="font-semibold">{selectedClient.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedClient.phone || selectedClient.email || 'Sem contato'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Cliente não informado</p>
          )}
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 pt-0">
          {selectedEquipment ? (
            <div>
              <p className="font-semibold">{selectedEquipment.description}</p>
              <p className="text-sm text-muted-foreground">
                {formatEquipmentCode(selectedEquipment.code)}
                {formData.serial_number && ` • S/N: ${formData.serial_number}`}
              </p>
              {formData.accessories && (
                <p className="text-sm text-muted-foreground">
                  Acessórios: {formData.accessories}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Equipamento não informado</p>
          )}
        </CardContent>
      </Card>

      {/* Problem */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Problema
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 pt-0 space-y-3">
          <p className="text-sm">{formData.reported_issue}</p>
          <div className="flex flex-wrap gap-2">
            <Badge className={statusConfig.bgColor}>
              <span className={statusConfig.color}>{statusConfig.label}</span>
            </Badge>
            <Badge variant="outline">
              <span className={priorityConfig.color}>Prioridade: {priorityConfig.label}</span>
            </Badge>
            {formData.estimated_completion && (
              <Badge variant="outline">
                Previsão:{' '}
                {new Date(formData.estimated_completion + 'T00:00:00').toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {formData.items.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Serviços e Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 pt-0">
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {item.type === 'service' ? (
                    <Wrench className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Package className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="flex-1">{item.description}</span>
                  <span className="text-muted-foreground">x{item.quantity}</span>
                  <span className="font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="space-y-1 text-sm">
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
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando OS...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Criar Ordem de Serviço
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
