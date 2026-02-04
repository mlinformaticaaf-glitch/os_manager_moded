import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutDashboard, List } from 'lucide-react';
import { useBoletos } from '@/hooks/useBoletos';
import { BoletosDashboard } from '@/components/boletos/BoletosDashboard';
import { BoletosTable } from '@/components/boletos/BoletosTable';
import { BoletoForm } from '@/components/boletos/BoletoForm';
import { PaymentDialog } from '@/components/boletos/PaymentDialog';
import { BoletoDetailDialog } from '@/components/boletos/BoletoDetailDialog';
import { DeleteBoletoDialog } from '@/components/boletos/DeleteBoletoDialog';
import { Boleto } from '@/types/boleto';
import { Skeleton } from '@/components/ui/skeleton';

export default function Boletos() {
  const { boletos, payments, isLoading, deleteBoleto, isDeleting } = useBoletos();
  
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleEdit = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setShowForm(true);
  };

  const handleDelete = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setShowDelete(true);
  };

  const handleRegisterPayment = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setShowPayment(true);
  };

  const handleViewDetails = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setShowDetails(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedBoleto) {
      await deleteBoleto(selectedBoleto.id);
      setShowDelete(false);
      setSelectedBoleto(null);
    }
  };

  const handleNewBoleto = () => {
    setSelectedBoleto(null);
    setShowForm(true);
  };

  const getPayment = (boletoId: string) => {
    return payments.find((p: { boleto_id: string }) => p.boleto_id === boletoId);
  };

  if (isLoading) {
    return (
      <MainLayout title="Boletos">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Boletos" subtitle="Gerencie seus boletos e contas a pagar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Boletos</h1>
            <p className="text-muted-foreground">
              Gerencie seus boletos e contas a pagar
            </p>
          </div>
          <Button onClick={handleNewBoleto}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Boleto
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <BoletosDashboard
              boletos={boletos}
              payments={payments}
              onViewBoleto={handleViewDetails}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <BoletosTable
              boletos={boletos}
              payments={payments}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegisterPayment={handleRegisterPayment}
              onViewDetails={handleViewDetails}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <BoletoForm
        open={showForm}
        onOpenChange={setShowForm}
        editingBoleto={selectedBoleto}
      />

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        boleto={selectedBoleto}
      />

      <BoletoDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        boleto={selectedBoleto}
        payment={selectedBoleto ? getPayment(selectedBoleto.id) : null}
      />

      <DeleteBoletoDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        boleto={selectedBoleto}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </MainLayout>
  );
}
