import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Client } from '@/types/client';
import { Loader2 } from 'lucide-react';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  document: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(2).optional().or(z.literal('')),
  zip_code: z.string().max(10).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: ClientFormData) => void;
  isSubmitting?: boolean;
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
  isSubmitting,
}: ClientFormProps) {
  useMobileBackButton(open, () => onOpenChange(false));

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      document: '',
      address: '',
      city: 'Águas Formosas',
      state: 'MG',
      zip_code: '39.880-000',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: client?.name ?? '',
        phone: client?.phone ?? '',
        document: client?.document ?? '',
        address: client?.address ?? '',
        city: client?.city ?? 'Águas Formosas',
        state: client?.state ?? 'MG',
        zip_code: client?.zip_code ?? '39.880-000',
        notes: client?.notes ?? '',
      });
    }
  }, [open, client, form]);

  const handleSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      phone: data.phone || undefined,
      document: data.document || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zip_code: data.zip_code || undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full max-w-[100vw] sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle>
                  {client ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {client ? 'Atualize as informações do cliente' : 'Preencha os dados do novo cliente'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 w-[96%] mx-auto sm:w-full max-w-[96%] sm:max-w-full min-w-0 overflow-x-hidden">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <CapitalizedInput placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <CapitalizedInput placeholder="Rua, número, complemento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <CapitalizedInput placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" maxLength={2} {...field} className="uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <CapitalizedTextarea
                          placeholder="Observações sobre o cliente..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <div className="shrink-0 flex gap-3 p-4 sm:p-6 border-t bg-muted/20">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {client ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}



