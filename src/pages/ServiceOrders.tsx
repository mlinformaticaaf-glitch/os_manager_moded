import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Plus, Search, Loader2, LayoutGrid, List, CalendarIcon, X, Wand2 } from 'lucide-react';
import { useServiceOrders, useServiceOrderItems } from '@/hooks/useServiceOrders';
import { OSStatusBlockView } from '@/components/os/OSStatusBlockView';
import { OSListView } from '@/components/os/OSListView';
import { OSForm } from '@/components/os/OSForm';
import { OSDetailView } from '@/components/os/OSDetailView';
import { DeleteOSDialog } from '@/components/os/DeleteOSDialog';
import { OSWizard } from '@/components/os/wizard';
import { ServiceOrder, OSStatus } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { ExportButton } from '@/components/common/ExportButton';
import { FileText } from 'lucide-react';
import { exportOSReportPDF } from '@/components/os/reports/OSReportGenerator';

type ViewMode = 'blocks' | 'list';

const VIEW_MODE_KEY = 'os-view-mode';

function getStoredViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  if (stored === 'blocks' || stored === 'list') {
    return stored;
  }
  return 'blocks';
}

export default function ServiceOrders() {
  const { orders, isLoading, createOrder, updateOrder, updateStatus, deleteOrder } = useServiceOrders();
  const { statusConfig, orderedStatuses, getStatusConfig } = useStatusSettings();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OSStatus | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [formOpen, setFormOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<ServiceOrder | null>(null);

  const { data: viewingOrderItems = [] } = useServiceOrderItems(viewingOrder?.id ?? null);
  const { data: editingOrderItems = [] } = useServiceOrderItems(editingOrder?.id ?? null);

  // Handle navigation state to open a specific order
  useEffect(() => {
    const state = location.state as { viewOrderId?: string } | null;
    if (state?.viewOrderId && orders.length > 0) {
      const orderToView = orders.find(o => o.id === state.viewOrderId);
      if (orderToView) {
        setViewingOrder(orderToView);
        // Clear the state to prevent re-opening on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !search.trim() ||
        order.order_number.toString().includes(search) ||
        order.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.equipment?.toLowerCase().includes(search.toLowerCase()) ||
        order.reported_issue?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const orderDate = new Date(order.created_at);
      const matchesStartDate = !startDate || orderDate >= startDate;
      const matchesEndDate = !endDate || orderDate <= new Date(endDate.getTime() + 86400000 - 1); // End of day

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [orders, search, statusFilter, startDate, endDate]);

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
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

  const handleStatusChange = (orderId: string, status: OSStatus) => {
    updateStatus.mutate({ id: orderId, status });
  };

  const handleDelete = () => {
    if (deletingOrder) {
      deleteOrder.mutate(deletingOrder.id, {
        onSuccess: () => setDeletingOrder(null),
      });
    }
  };

  const activeCount = orders.filter(o => !['completed', 'delivered', 'cancelled'].includes(o.status)).length;

  return (
    <MainLayout title="Ordens de Serviço" subtitle={`${activeCount} OS ativas`}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº, cliente, equipamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OSStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">Todos os status</SelectItem>
                {orderedStatuses.map((key) => (
                  <SelectItem key={key} value={key}>
                    {statusConfig[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range and View Toggle Row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground text-sm hidden sm:inline">até</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearDateFilters}
                  className="h-8 w-8"
                  title="Limpar filtro de datas"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* View Toggle and New Button */}
            <div className="flex gap-2 sm:gap-3">
              <Tabs
                value={viewMode}
                onValueChange={(v) => {
                  const newMode = v as ViewMode;
                  setViewMode(newMode);
                  localStorage.setItem(VIEW_MODE_KEY, newMode);
                }}
              >
                <TabsList className="h-9">
                  <TabsTrigger value="blocks" className="gap-1.5 px-2.5">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Status</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-1.5 px-2.5">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Lista</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={() => setWizardOpen(true)} size="sm" className="gap-1.5">
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">Assistente</span>
              </Button>

              <Button onClick={handleCreate} size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Form. Clássico</span>
              </Button>
              <ExportButton data={filteredOrders} filename="ordens_de_servico" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportOSReportPDF(filteredOrders)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Relatório PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'blocks' ? (
          <OSStatusBlockView
            orders={filteredOrders}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={setDeletingOrder}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <OSListView
            orders={filteredOrders}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={setDeletingOrder}
          />
        )}
      </div>

      {/* Form Sheet */}
      <OSForm
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editingOrder}
        onSubmit={handleFormSubmit}
        isSubmitting={createOrder.isPending || updateOrder.isPending}
        existingItems={editingOrderItems}
      />

      {/* Detail View */}
      <OSDetailView
        open={!!viewingOrder}
        onOpenChange={(open) => !open && setViewingOrder(null)}
        order={viewingOrder}
        items={viewingOrderItems}
        onEdit={() => viewingOrder && handleEdit(viewingOrder)}
        onStatusChange={(status) => viewingOrder && handleStatusChange(viewingOrder.id, status)}
      />

      {/* Delete Confirmation */}
      <DeleteOSDialog
        open={!!deletingOrder}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
        order={deletingOrder}
        onConfirm={handleDelete}
        isDeleting={deleteOrder.isPending}
      />

      {/* Wizard */}
      <OSWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </MainLayout>
  );
}
