import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientForm } from '@/components/clients/ClientForm';
import { DeleteClientDialog } from '@/components/clients/DeleteClientDialog';
import { Client } from '@/types/client';
import { ExportButton } from '@/components/common/ExportButton';

export default function Clients() {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const searchLower = search.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.phone?.includes(search) ||
        client.document?.includes(search)
    );
  }, [clients, search]);

  const handleCreate = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, ...data },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createClient.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deletingClient) {
      deleteClient.mutate(deletingClient.id, {
        onSuccess: () => setDeletingClient(null),
      });
    }
  };

  return (
    <MainLayout title="Clientes" subtitle="Gerencie seus clientes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <ExportButton data={filteredClients} filename="clientes" />
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ClientsTable
            clients={filteredClients}
            onEdit={handleEdit}
            onDelete={setDeletingClient}
          />
        )}

        {/* Stats */}
        {!isLoading && clients.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredClients.length === clients.length
              ? `${clients.length} cliente${clients.length !== 1 ? 's' : ''} cadastrado${clients.length !== 1 ? 's' : ''}`
              : `${filteredClients.length} de ${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editingClient}
        onSubmit={handleFormSubmit}
        isSubmitting={createClient.isPending || updateClient.isPending}
        onDelete={() => {
          setFormOpen(false);
          setDeletingClient(editingClient);
        }}
      />

      {/* Delete Confirmation */}
      <DeleteClientDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
        client={deletingClient}
        onConfirm={handleDelete}
        isDeleting={deleteClient.isPending}
      />
    </MainLayout>
  );
}
