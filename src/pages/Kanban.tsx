import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Wand2, FilterX } from 'lucide-react';
import { useServiceOrders, useServiceOrderItems } from '@/hooks/useServiceOrders';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { OSStatus, ServiceOrder } from '@/types/serviceOrder';
import { OSForm } from '@/components/os/OSForm';
import { OSDetailView } from '@/components/os/OSDetailView';
import { DeleteOSDialog } from '@/components/os/DeleteOSDialog';
import { OSWizard } from '@/components/os/wizard';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Kanban() {
    const { orders, isLoading, createOrder, updateOrder, updateStatus, deleteOrder } = useServiceOrders();
    const { orderedStatuses, statusConfig } = useStatusSettings();
    const { toast } = useToast();

    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
    const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<ServiceOrder | null>(null);

    const { data: viewingOrderItems = [] } = useServiceOrderItems(viewingOrder?.id ?? null);
    const { data: editingOrderItems = [] } = useServiceOrderItems(editingOrder?.id ?? null);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                !search.trim() ||
                order.order_number.toString().includes(search) ||
                order.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
                order.equipment?.toLowerCase().includes(search.toLowerCase()) ||
                order.reported_issue?.toLowerCase().includes(search.toLowerCase());

            return matchesSearch;
        });
    }, [orders, search]);

    const handleStatusChange = async (orderId: string, status: OSStatus) => {
        updateStatus.mutate({
            id: orderId,
            status
        });
    };

    const handleCreate = () => {
        setEditingOrder(null);
        setFormOpen(true);
    };

    const handleEdit = (order: ServiceOrder) => {
        setViewingOrder(null);
        setEditingOrder(order);
        setFormOpen(true);
    };

    const handleView = (order: ServiceOrder) => {
        setViewingOrder(order);
    };

    const handleFormSubmit = (data: any) => {
        if (editingOrder) {
            updateOrder.mutate(
                { id: editingOrder.id, ...data },
                { onSuccess: () => setFormOpen(false) }
            );
        } else {
            createOrder.mutate(data, { onSuccess: () => setFormOpen(false) });
        }
    };

    const handleDelete = () => {
        if (deletingOrder) {
            deleteOrder.mutate(deletingOrder.id, {
                onSuccess: () => setDeletingOrder(null),
            });
        }
    };

    return (
        <MainLayout title="Kanban de Ordens de Serviço" subtitle="Gerencie visualmente o fluxo de trabalho">
            <div className="flex flex-col h-full space-y-4">
                {/* Kanban Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, nº de OS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <Button onClick={() => setWizardOpen(true)} size="sm" variant="outline" className="gap-1.5 h-10 border-primary/20 hover:bg-primary/5 shrink-0">
                            <Wand2 className="h-4 w-4 text-primary" />
                            <span>Assistente</span>
                        </Button>

                        <Button onClick={handleCreate} size="sm" className="gap-1.5 h-10 shrink-0">
                            <Plus className="h-4 w-4" />
                            <span>Nova OS</span>
                        </Button>
                    </div>
                </div>

                {/* Kanban Board Container */}
                <div className="flex-1 min-h-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <KanbanBoard
                            orders={filteredOrders}
                            onStatusChange={handleStatusChange}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={setDeletingOrder}
                        />
                    )}
                </div>
            </div>

            {/* Reusable Modals */}
            <OSForm
                open={formOpen}
                onOpenChange={setFormOpen}
                order={editingOrder}
                onSubmit={handleFormSubmit}
                isSubmitting={createOrder.isPending || updateOrder.isPending}
                existingItems={editingOrderItems}
            />

            <OSDetailView
                open={!!viewingOrder}
                onOpenChange={(open) => !open && setViewingOrder(null)}
                order={viewingOrder}
                items={viewingOrderItems}
                onEdit={() => viewingOrder && handleEdit(viewingOrder)}
                onStatusChange={(status) => viewingOrder && handleStatusChange(viewingOrder.id, status as OSStatus)}
            />

            <DeleteOSDialog
                open={!!deletingOrder}
                onOpenChange={(open) => !open && setDeletingOrder(null)}
                order={deletingOrder}
                onConfirm={handleDelete}
                isDeleting={deleteOrder.isPending}
            />

            <OSWizard open={wizardOpen} onOpenChange={setWizardOpen} />
        </MainLayout>
    );
}
