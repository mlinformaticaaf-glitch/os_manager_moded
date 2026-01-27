import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClients } from '@/hooks/useClients';
import { ClientForm } from '@/components/clients/ClientForm';
import { Search, Plus, User, Phone, Mail, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatClientCode } from '@/lib/clientUtils';
import { Client } from '@/types/client';

interface ClientStepProps {
  selectedClientId: string | null;
  onSelect: (clientId: string | null) => void;
  onNext: () => void;
}

export function ClientStep({ selectedClientId, onSelect, onNext }: ClientStepProps) {
  const { clients, createClient, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [clientFormOpen, setClientFormOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const query = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(query)
    );
  }, [clients, search]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleCreateClient = (data: any) => {
    createClient.mutate(data, {
      onSuccess: (newClient) => {
        onSelect(newClient.id);
        setClientFormOpen(false);
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Quem é o cliente?</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Selecione um cliente existente ou cadastre um novo
        </p>
      </div>

      {/* Selected Client Preview */}
      {selectedClient && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                  {getInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedClient.code && (
                    <span className="text-xs font-mono bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded">{formatClientCode(selectedClient.code)}</span>
                  )}
                  <p className="font-semibold truncate text-sm sm:text-base">{selectedClient.name}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {selectedClient.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedClient.phone}
                    </span>
                  )}
                  {selectedClient.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {selectedClient.email}
                    </span>
                  )}
                </div>
              </div>
              <Check className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setClientFormOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Clients List */}
      <ScrollArea className="h-[200px] sm:h-[300px] rounded-lg border">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Carregando clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mb-2" />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={client.id === selectedClientId}
                onSelect={() => onSelect(client.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Skip option */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm"
          onClick={() => {
            onSelect(null);
            onNext();
          }}
        >
          Pular (sem cliente)
        </Button>
        <Button onClick={onNext} disabled={!selectedClientId} size="sm" className="sm:size-default">
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <ClientForm
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSubmit={handleCreateClient}
        isSubmitting={createClient.isPending}
      />
    </div>
  );
}

function ClientCard({
  client,
  isSelected,
  onSelect,
}: {
  client: Client;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 border border-primary"
          : "hover:bg-muted border border-transparent"
      )}
    >
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        <AvatarFallback className={cn("text-xs sm:text-sm", isSelected ? "bg-primary text-primary-foreground" : "")}>
          {getInitials(client.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {client.code && (
            <span className="text-xs font-mono bg-muted px-1 sm:px-1.5 py-0.5 rounded">{formatClientCode(client.code)}</span>
          )}
          <p className="font-medium truncate text-sm sm:text-base">{client.name}</p>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">
          {client.phone || client.email || 'Sem contato'}
        </p>
      </div>
      {isSelected && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />}
    </button>
  );
}
