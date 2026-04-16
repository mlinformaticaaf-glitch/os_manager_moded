import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePurchases } from '@/hooks/usePurchases';
import { PurchasesTable } from '@/components/purchases/PurchasesTable';
import { PurchaseForm } from '@/components/purchases/PurchaseForm';
import { PurchaseViewDialog } from '@/components/purchases/PurchaseViewDialog';
import { DeletePurchaseDialog } from '@/components/purchases/DeletePurchaseDialog';
import { Purchase, PurchaseItem } from '@/types/purchase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Purchases() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingItems, setEditingItems] = useState<Omit<PurchaseItem, 'id' | 'purchase_id'>[]>([]);

  const { purchases, isLoading, createPurchase, updatePurchase, updatePurchasePayment, deletePurchase, fetchPurchaseItems } = usePurchases();

  // Handle navigation state to open a specific purchase
  useEffect(() => {
    const state = location.state as { viewPurchaseId?: string } | null;
    if (state?.viewPurchaseId && purchases.length > 0) {
      const purchaseToView = purchases.find(p => p.id === state.viewPurchaseId);
      if (purchaseToView) {
        setViewingPurchase(purchaseToView);
        // Clear the state to prevent re-opening on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, purchases]);

  const filteredPurchases = useMemo(() => {
    if (!search.trim()) return purchases;
    const query = search.toLowerCase();
    return purchases.filter(
      (p) =>
        p.purchase_number.toString().includes(query) ||
        p.invoice_number?.toLowerCase().includes(query) ||
        p.supplier?.name.toLowerCase().includes(query)
    );
  }, [purchases, search]);

  // Stats
  const stats = useMemo(() => {
    const total = purchases.reduce((sum, p) => sum + p.total, 0);
    const pending = purchases.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + p.total, 0);
    const paid = purchases.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.total, 0);
    
    return { total, pending, paid, count: purchases.length };
  }, [purchases]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleFormSubmit = async (data: { purchase: Record<string, unknown>; items: Omit<PurchaseItem, 'id' | 'purchase_id'>[] }) => {
    if (editingPurchase) {
      await updatePurchase.mutateAsync({
        id: editingPurchase.id,
        purchase: data.purchase as Parameters<typeof updatePurchase.mutateAsync>[0]['purchase'],
        items: data.items,
      });
      setEditingPurchase(null);
      setEditingItems([]);
    } else {
      await createPurchase.mutateAsync(data as Parameters<typeof createPurchase.mutateAsync>[0]);
    }
    setFormOpen(false);
  };

  const handleEdit = async (purchase: Purchase) => {
    try {
      const items = await fetchPurchaseItems(purchase.id);
      setEditingPurchase(purchase);
      setEditingItems(items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })));
      setFormOpen(true);
    } catch (error) {
      console.error('Error fetching purchase items:', error);
    }
  };

  const handleMarkAsPaid = async (purchase: Purchase) => {
    await updatePurchasePayment.mutateAsync({
      id: purchase.id,
      payment_status: 'paid',
    });
  };

  const handleDelete = async () => {
    if (deletingPurchase) {
      await deletePurchase.mutateAsync(deletingPurchase.id);
      setDeletingPurchase(null);
    }
  };

  const handleView = (purchase: Purchase) => {
    setViewingPurchase(purchase);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingPurchase(null);
      setEditingItems([]);
    }
  };

  return (
    <MainLayout
      title="Compras"
      subtitle="Gerencie suas compras de produtos"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total de Compras
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold truncate">{formatCurrency(stats.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                A Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold text-destructive truncate">{formatCurrency(stats.pending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">{formatCurrency(stats.paid)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar compras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Compra
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
          <PurchasesTable
            purchases={filteredPurchases}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={setDeletingPurchase}
            onView={handleView}
          />
        )}

        {/* Summary */}
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredPurchases.length} de {purchases.length} compras
        </p>
      </div>

      {/* View Dialog */}
      <PurchaseViewDialog
        open={!!viewingPurchase}
        onOpenChange={(open) => !open && setViewingPurchase(null)}
        purchase={viewingPurchase}
        onEdit={handleEdit}
      />

      {/* Form Sheet */}
      <PurchaseForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        isSubmitting={createPurchase.isPending || updatePurchase.isPending}
        editingPurchase={editingPurchase}
        editingItems={editingItems}
        onDelete={() => {
          setFormOpen(false);
          setDeletingPurchase(editingPurchase);
        }}
      />

      {/* Delete Dialog */}
      <DeletePurchaseDialog
        open={!!deletingPurchase}
        onOpenChange={(open) => !open && setDeletingPurchase(null)}
        purchase={deletingPurchase}
        onConfirm={handleDelete}
        isDeleting={deletePurchase.isPending}
      />
    </MainLayout>
  );
}
