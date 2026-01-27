import { useState, useMemo } from 'react';
import { Plus, Search, Wrench } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServicesTable } from '@/components/services/ServicesTable';
import { ServiceForm } from '@/components/services/ServiceForm';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types/service';

export default function Services() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const { services, isLoading, createService, updateService, deleteService } = useServices();

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const searchLower = search.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchLower) ||
        service.code?.toLowerCase().includes(searchLower) ||
        service.category?.toLowerCase().includes(searchLower)
    );
  }, [services, search]);

  const handleCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingService) {
      await updateService.mutateAsync({ id: editingService.id, data });
    } else {
      await createService.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingService(null);
  };

  const handleDelete = async () => {
    if (deletingService) {
      await deleteService.mutateAsync(deletingService.id);
      setDeletingService(null);
    }
  };

  return (
    <MainLayout title="Serviços" subtitle="Gerencie seu catálogo de serviços">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        {/* Services Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ServicesTable
            services={filteredServices}
            onEdit={handleEdit}
            onDelete={setDeletingService}
          />
        )}

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wrench className="h-4 w-4" />
          <span>
            {filteredServices.length} de {services.length} serviço(s)
          </span>
        </div>
      </div>

      {/* Service Form */}
      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        onSubmit={handleFormSubmit}
        isSubmitting={createService.isPending || updateService.isPending}
      />

      {/* Delete Dialog */}
      <DeleteServiceDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
        service={deletingService}
        onConfirm={handleDelete}
        isDeleting={deleteService.isPending}
      />
    </MainLayout>
  );
}
