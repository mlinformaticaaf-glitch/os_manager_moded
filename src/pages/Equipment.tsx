import { useState, useMemo } from 'react';
import { Plus, Search, Monitor } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { EquipmentViewDialog } from '@/components/equipment/EquipmentViewDialog';
import { DeleteEquipmentDialog } from '@/components/equipment/DeleteEquipmentDialog';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment } from '@/types/equipment';

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);

  const { equipment, isLoading, createEquipment, updateEquipment, deleteEquipment } = useEquipment();

  const filteredEquipment = useMemo(() => {
    if (!search.trim()) return equipment;
    const searchLower = search.toLowerCase();
    return equipment.filter(
      (item) =>
        item.description.toLowerCase().includes(searchLower) ||
        (item.code && `EQP-${item.code}`.toLowerCase().includes(searchLower))
    );
  }, [equipment, search]);

  const handleCreate = () => {
    setEditingEquipment(null);
    setFormOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: { description: string; active: boolean }) => {
    if (editingEquipment) {
      await updateEquipment.mutateAsync({ id: editingEquipment.id, data });
    } else {
      await createEquipment.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingEquipment(null);
  };

  const handleDelete = async () => {
    if (deletingEquipment) {
      await deleteEquipment.mutateAsync(deletingEquipment.id);
      setDeletingEquipment(null);
    }
  };

  return (
    <MainLayout title="Equipamentos" subtitle="Cadastre e gerencie seus equipamentos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>

        {/* Equipment Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <EquipmentTable
            equipment={filteredEquipment}
            onEdit={handleEdit}
            onDelete={setDeletingEquipment}
            onView={setViewingEquipment}
          />
        )}

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Monitor className="h-4 w-4" />
          <span>
            {filteredEquipment.length} de {equipment.length} equipamento(s)
          </span>
        </div>
      </div>

      {/* Equipment View Dialog */}
      <EquipmentViewDialog
        open={!!viewingEquipment}
        onOpenChange={(open) => !open && setViewingEquipment(null)}
        equipment={viewingEquipment}
        onEdit={handleEdit}
      />

      {/* Equipment Form */}
      <EquipmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editingEquipment}
        onSubmit={handleFormSubmit}
        isSubmitting={createEquipment.isPending || updateEquipment.isPending}
      />

      {/* Delete Dialog */}
      <DeleteEquipmentDialog
        open={!!deletingEquipment}
        onOpenChange={(open) => !open && setDeletingEquipment(null)}
        equipment={deletingEquipment}
        onConfirm={handleDelete}
        isDeleting={deleteEquipment.isPending}
      />
    </MainLayout>
  );
}
