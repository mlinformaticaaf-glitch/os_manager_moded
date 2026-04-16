import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { DeleteSupplierDialog } from '@/components/suppliers/DeleteSupplierDialog';
import { Supplier } from '@/types/supplier';
import { Skeleton } from '@/components/ui/skeleton';

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const query = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.document?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
    );
  }, [suppliers, search]);

  const handleCreate = () => {
    setEditingSupplier(null);
    setFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, data });
    } else {
      await createSupplier.mutateAsync(data as Parameters<typeof createSupplier.mutateAsync>[0]);
    }
    setFormOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = async () => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      setDeletingSupplier(null);
    }
  };

  return (
    <MainLayout
      title="Fornecedores"
      subtitle="Gerencie seus fornecedores"
    >
      <div className="space-y-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <SuppliersTable
            suppliers={filteredSuppliers}
            onEdit={handleEdit}
            onDelete={setDeletingSupplier}
          />
        )}

        {/* Summary */}
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredSuppliers.length} de {suppliers.length} fornecedores
        </p>
      </div>

      {/* Form Sheet */}
      <SupplierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editingSupplier}
        onSubmit={handleFormSubmit}
        isSubmitting={createSupplier.isPending || updateSupplier.isPending}
        onDelete={() => {
          setFormOpen(false);
          setDeletingSupplier(editingSupplier);
        }}
      />

      {/* Delete Dialog */}
      <DeleteSupplierDialog
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        supplier={deletingSupplier}
        onConfirm={handleDelete}
        isDeleting={deleteSupplier.isPending}
      />
    </MainLayout>
  );
}
