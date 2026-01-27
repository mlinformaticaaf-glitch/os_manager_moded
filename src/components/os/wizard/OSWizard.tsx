import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { WizardProgress } from './WizardProgress';
import { ClientStep } from './steps/ClientStep';
import { EquipmentStep } from './steps/EquipmentStep';
import { ProblemStep } from './steps/ProblemStep';
import { ServicesStep } from './steps/ServicesStep';
import { SummaryStep } from './steps/SummaryStep';
import { WizardStep, WizardFormData, WizardItemData, WIZARD_STEPS } from './types';
import { useServiceOrders, useServiceOrderItems } from '@/hooks/useServiceOrders';
import { ServiceOrder, ServiceOrderItem } from '@/types/serviceOrder';
import { printOSA4 } from '@/components/os/print/printOS';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useClients } from '@/hooks/useClients';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardWhatsAppDialog } from './steps/WizardWhatsAppDialog';

interface OSWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData: WizardFormData = {
  client_id: null,
  equipment_id: null,
  status: 'pending',
  priority: 'normal',
  serial_number: '',
  accessories: '',
  reported_issue: '',
  diagnosis: '',
  solution: '',
  internal_notes: '',
  estimated_completion: '',
  discount: 0,
  payment_method: null,
  items: [],
};

export function OSWizard({ open, onOpenChange }: OSWizardProps) {
  const { createOrder, orders } = useServiceOrders();
  const { settings } = useCompanySettings();
  const { clients } = useClients();
  const [currentStep, setCurrentStep] = useState<WizardStep>('client');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);

  const markStepCompleted = useCallback((step: WizardStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
    markStepCompleted(currentStep);
    if (currentIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentIndex + 1].id);
    }
  }, [currentStep, markStepCompleted]);

  const goBack = useCallback(() => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentIndex - 1].id);
    }
  }, [currentStep]);

  const updateFormData = useCallback((updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const addItem = useCallback((item: WizardItemData) => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ),
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const totalServices = formData.items
      .filter((i) => i.type === 'service')
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const totalProducts = formData.items
      .filter((i) => i.type === 'product')
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const total = Math.max(0, totalServices + totalProducts - formData.discount);

    createOrder.mutate(
      {
        client_id: formData.client_id,
        equipment_id: formData.equipment_id,
        status: formData.status,
        priority: formData.priority,
        serial_number: formData.serial_number || null,
        accessories: formData.accessories || null,
        reported_issue: formData.reported_issue,
        diagnosis: formData.diagnosis || null,
        solution: formData.solution || null,
        internal_notes: formData.internal_notes || null,
        estimated_completion: formData.estimated_completion || null,
        discount: formData.discount,
        payment_method: formData.payment_method,
        total_services: totalServices,
        total_products: totalProducts,
        total,
        payment_status: 'pending',
        stock_deducted: false,
        warranty_until: null,
        completed_at: null,
        delivered_at: null,
        equipment: null,
        brand: null,
        model: null,
        items: formData.items.map((item) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        })),
      },
      {
        onSuccess: (newOrder) => {
          setCreatedOrder(newOrder);
          markStepCompleted('summary');
        },
      }
    );
  }, [formData, createOrder, markStepCompleted]);

  const handlePrint = useCallback(() => {
    if (!createdOrder) return;

    const items: ServiceOrderItem[] = formData.items.map((item, index) => ({
      id: `temp-${index}`,
      service_order_id: createdOrder.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      created_at: new Date().toISOString(),
    }));

    const selectedClient = clients.find((c) => c.id === formData.client_id);
    const orderWithClient = {
      ...createdOrder,
      client: selectedClient
        ? { id: selectedClient.id, name: selectedClient.name, phone: selectedClient.phone, email: selectedClient.email }
        : null,
    };

    printOSA4({
      order: orderWithClient,
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
    });
  }, [createdOrder, formData, clients, settings]);

  const handleWhatsApp = useCallback(() => {
    setShowWhatsAppDialog(true);
  }, []);

  const getWhatsAppData = useCallback(() => {
    if (!createdOrder) return null;

    const selectedClient = clients.find((c) => c.id === formData.client_id);
    if (!selectedClient) return null;

    const items: ServiceOrderItem[] = formData.items.map((item, index) => ({
      id: `temp-${index}`,
      service_order_id: createdOrder.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      created_at: new Date().toISOString(),
    }));

    const orderWithClient: ServiceOrder = {
      ...createdOrder,
      client: {
        id: selectedClient.id,
        name: selectedClient.name,
        phone: selectedClient.phone || null,
        email: selectedClient.email || null,
      },
    };

    return { order: orderWithClient, items };
  }, [createdOrder, formData, clients]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setCurrentStep('client');
      setCompletedSteps([]);
      setFormData(initialFormData);
      setCreatedOrder(null);
    }, 300);
  }, [onOpenChange]);

  const renderStep = () => {
    switch (currentStep) {
      case 'client':
        return (
          <ClientStep
            selectedClientId={formData.client_id}
            onSelect={(clientId) => updateFormData({ client_id: clientId })}
            onNext={goNext}
          />
        );
      case 'equipment':
        return (
          <EquipmentStep
            selectedEquipmentId={formData.equipment_id}
            serialNumber={formData.serial_number}
            accessories={formData.accessories}
            onSelectEquipment={(equipmentId) => updateFormData({ equipment_id: equipmentId })}
            onChangeSerialNumber={(value) => updateFormData({ serial_number: value })}
            onChangeAccessories={(value) => updateFormData({ accessories: value })}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 'problem':
        return (
          <ProblemStep
            reportedIssue={formData.reported_issue}
            status={formData.status}
            priority={formData.priority}
            estimatedCompletion={formData.estimated_completion}
            onChangeReportedIssue={(value) => updateFormData({ reported_issue: value })}
            onChangeStatus={(value) => updateFormData({ status: value })}
            onChangePriority={(value) => updateFormData({ priority: value })}
            onChangeEstimatedCompletion={(value) => updateFormData({ estimated_completion: value })}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 'services':
        return (
          <ServicesStep
            items={formData.items}
            discount={formData.discount}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateItemQuantity={updateItemQuantity}
            onChangeDiscount={(value) => updateFormData({ discount: value })}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 'summary':
        return (
          <SummaryStep
            formData={formData}
            onBack={goBack}
            onSubmit={handleSubmit}
            isSubmitting={createOrder.isPending}
            createdOrderId={createdOrder?.id}
            onPrint={handlePrint}
            onWhatsApp={handleWhatsApp}
          />
        );
      default:
        return null;
    }
  };

  const whatsAppData = getWhatsAppData();

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 gap-0">
          <div className="p-6 border-b">
            <WizardProgress currentStep={currentStep} completedSteps={completedSteps} />
          </div>
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6">{renderStep()}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {whatsAppData && (
        <WizardWhatsAppDialog
          open={showWhatsAppDialog}
          onOpenChange={setShowWhatsAppDialog}
          order={whatsAppData.order}
          items={whatsAppData.items}
          companyName={settings?.name || 'Assistência Técnica'}
          footerMessage={settings?.footer_message || 'Obrigado pela preferência!'}
        />
      )}
    </>
  );
}
