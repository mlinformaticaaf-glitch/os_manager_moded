import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSales } from '@/hooks/useSales';
import { SalesTable } from '@/components/sales/SalesTable';
import { SaleForm } from '@/components/sales/SaleForm';
import { SaleViewDialog } from '@/components/sales/SaleViewDialog';
import { DeleteSaleDialog } from '@/components/sales/DeleteSaleDialog';
import { Sale, SaleItem } from '@/types/sale';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Sales() {
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
    const [viewingSale, setViewingSale] = useState<Sale | null>(null);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [editingItems, setEditingItems] = useState<Omit<SaleItem, 'id' | 'sale_id'>[]>([]);

    const { sales, isLoading, createSale, updateSale, updateSalePayment, deleteSale, fetchSaleItems } = useSales();

    // Handle navigation state to open a specific sale
    useEffect(() => {
        const state = location.state as { viewSaleId?: string } | null;
        if (state?.viewSaleId && sales.length > 0) {
            const saleToView = sales.find(p => p.id === state.viewSaleId);
            if (saleToView) {
                setViewingSale(saleToView);
                // Clear the state to prevent re-opening on subsequent renders
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, sales]);

    const filteredSales = useMemo(() => {
        if (!search.trim()) return sales;
        const query = search.toLowerCase();
        return sales.filter(
            (p) =>
                p.sale_number.toString().includes(query) ||
                p.client?.name.toLowerCase().includes(query)
        );
    }, [sales, search]);

    // Stats
    const stats = useMemo(() => {
        const total = sales.reduce((sum, p) => sum + p.total, 0);
        const pending = sales.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + p.total, 0);
        const paid = sales.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.total, 0);

        return { total, pending, paid, count: sales.length };
    }, [sales]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleFormSubmit = async (data: { sale: Record<string, unknown>; items: Omit<SaleItem, 'id' | 'sale_id'>[] }) => {
        if (editingSale) {
            await updateSale.mutateAsync({
                id: editingSale.id,
                sale: data.sale as any,
                items: data.items,
            });
            setEditingSale(null);
            setEditingItems([]);
        } else {
            await createSale.mutateAsync(data as any);
        }
        setFormOpen(false);
    };

    const handleEdit = async (sale: Sale) => {
        try {
            const items = await fetchSaleItems(sale.id);
            setEditingSale(sale);
            setEditingItems(items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: item.total,
            })));
            setFormOpen(true);
        } catch (error) {
            console.error('Error fetching sale items:', error);
        }
    };

    const handleMarkAsPaid = async (sale: Sale) => {
        await updateSalePayment.mutateAsync({
            id: sale.id,
            payment_status: 'paid',
        });
    };

    const handleDelete = async () => {
        if (deletingSale) {
            await deleteSale.mutateAsync(deletingSale.id);
            setDeletingSale(null);
        }
    };

    const handleView = async (sale: Sale) => {
        try {
            const items = await fetchSaleItems(sale.id);
            setViewingSale({ ...sale, items });
        } catch (error) {
            console.error('Error fetching sale items:', error);
            setViewingSale(sale);
        }
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) {
            setEditingSale(null);
            setEditingItems([]);
        }
    };

    return (
        <MainLayout
            title="Vendas"
            subtitle="Gerencie suas vendas de produtos"
        >
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card>
                        <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Total de Vendas
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
                                A Receber
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <p className="text-xl sm:text-2xl font-bold text-destructive truncate">{formatCurrency(stats.pending)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Recebido
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
                            placeholder="Buscar vendas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={() => setFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Venda
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
                    <SalesTable
                        sales={filteredSales}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDelete={setDeletingSale}
                        onView={handleView}
                    />
                )}

                {/* Summary */}
                <p className="text-sm text-muted-foreground">
                    Mostrando {filteredSales.length} de {sales.length} vendas
                </p>
            </div>

            {/* View Dialog */}
            <SaleViewDialog
                open={!!viewingSale}
                onOpenChange={(open) => !open && setViewingSale(null)}
                sale={viewingSale}
                onEdit={handleEdit}
            />

            {/* Form Sheet */}
            <SaleForm
                open={formOpen}
                onOpenChange={handleFormClose}
                onSubmit={handleFormSubmit}
                isSubmitting={createSale.isPending || updateSale.isPending}
                editingSale={editingSale}
                editingItems={editingItems}
                onDelete={() => {
                    setFormOpen(false);
                    setDeletingSale(editingSale);
                }}
            />

            {/* Delete Dialog */}
            <DeleteSaleDialog
                open={!!deletingSale}
                onOpenChange={(open) => !open && setDeletingSale(null)}
                sale={deletingSale}
                onConfirm={handleDelete}
                isDeleting={deleteSale.isPending}
            />
        </MainLayout>
    );
}
