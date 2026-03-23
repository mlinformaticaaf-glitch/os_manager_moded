import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CapitalizedInput } from "@/components/ui/capitalized-input";
import { CapitalizedTextarea } from "@/components/ui/capitalized-textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyInput } from "@/components/ui/currency-input";

import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { FinancialTransaction, TRANSACTION_TYPE_OPTIONS, TRANSACTION_CATEGORY_OPTIONS, TRANSACTION_STATUS_OPTIONS } from "@/types/financial";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { Trash2, Check, ChevronsUpDown, UserPlus, Plus } from "lucide-react";
import { useMobileBackButton } from "@/hooks/useMobileBackButton";
import { useClients } from "@/hooks/useClients";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ClientForm } from "@/components/clients/ClientForm";
import { useMemo } from "react";

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Selecione uma categoria"),
  client_id: z.string().optional().nullable(),
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
  due_date: z.string().optional().nullable(),
  paid_date: z.string().optional().nullable(),
  status: z.enum(['pending', 'paid', 'cancelled']),
  payment_method: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  recurring: z.boolean().default(false),
  recurring_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  installments: z.coerce.number().min(1).default(1),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialTransaction | null;
}

export function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen);
  }, [onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useMobileBackButton(open, handleClose);

  const isEditing = !!transaction;
  const { createTransaction, updateTransaction, deleteTransaction } = useFinancialTransactions();
  const { clients, createClient } = useClients();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientFormOpen, setClientFormOpen] = useState(false);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'income',
      category: '',
      client_id: null,
      description: '',
      amount: 0,
      due_date: '',
      paid_date: '',
      status: 'pending',
      payment_method: '',
      notes: '',
      recurring: false,
      recurring_period: 'monthly',
      installments: 1,
    },
  });

  const selectedType = form.watch('type');
  const isRecurring = form.watch('recurring');

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        category: transaction.category,
        client_id: transaction.client_id || null,
        description: transaction.description,
        amount: Number(transaction.amount),
        due_date: transaction.due_date || '',
        paid_date: transaction.paid_date || '',
        status: transaction.status,
        payment_method: transaction.payment_method || '',
        notes: transaction.notes || '',
        recurring: transaction.recurring || false,
        recurring_period: transaction.recurring_period || 'monthly',
        installments: transaction.installments || 1,
      });
    } else {
      form.reset({
        type: 'income',
        category: '',
        client_id: null,
        description: '',
        amount: 0,
        due_date: '',
        paid_date: '',
        status: 'pending',
        payment_method: '',
        notes: '',
        recurring: false,
        recurring_period: 'monthly',
        installments: 1,
      });
    }
  }, [transaction, form, open]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (isEditing && transaction) {
        // When editing, just update the single record
        await updateTransaction.mutateAsync({
          id: transaction.id,
          data: {
            type: data.type,
            category: data.category,
            client_id: data.client_id || null,
            description: data.description,
            amount: data.amount,
            status: data.status,
            due_date: data.due_date || null,
            paid_date: data.paid_date || null,
            payment_method: data.payment_method || null,
            notes: data.notes || null,
            recurring: data.recurring,
            recurring_period: data.recurring_period,
            installments: data.installments,
          } as any,
        });
      } else {
        const count = data.recurring ? (data.installments ?? 1) : 1;
        const baseDate = data.due_date ? new Date(data.due_date + 'T12:00:00') : null;

        const advanceDate = (date: Date, step: number): Date => {
          const period = data.recurring_period ?? 'monthly';
          if (period === 'daily') return new Date(date.getFullYear(), date.getMonth(), date.getDate() + step);
          if (period === 'weekly') return new Date(date.getFullYear(), date.getMonth(), date.getDate() + step * 7);
          if (period === 'yearly') return new Date(date.getFullYear() + step, date.getMonth(), date.getDate());
          // monthly (default)
          const d = new Date(date.getFullYear(), date.getMonth() + step, date.getDate());
          return d;
        };

        for (let i = 0; i < count; i++) {
          const installmentDate = baseDate ? advanceDate(baseDate, i) : null;
          const dueDateStr = installmentDate
            ? installmentDate.toISOString().split('T')[0]
            : data.due_date || null;

          const description = count > 1
            ? `${data.description} (${i + 1}/${count})`
            : data.description;

          // First installment keeps user's selected status; future ones are always pending
          const installmentStatus = i === 0 ? data.status : 'pending';
          const installmentPaidDate = i === 0 ? (data.paid_date || null) : null;

          await createTransaction.mutateAsync({
            type: data.type,
            category: data.category,
            client_id: data.client_id || null,
            description,
            amount: data.amount,
            status: installmentStatus,
            reference_id: null,
            due_date: dueDateStr,
            paid_date: installmentPaidDate,
            payment_method: data.payment_method || null,
            notes: data.notes || null,
            recurring: data.recurring,
            recurring_period: data.recurring_period ?? 'monthly',
            installments: count,
          } as any);
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone?.includes(clientSearch) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const selectedClient = clients.find(c => c.id === form.watch('client_id'));

  const handleCreateClient = (data: any) => {
    createClient.mutate(data, {
      onSuccess: (newClient) => {
        form.setValue('client_id', newClient.id);
        setClientFormOpen(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-lg w-full max-w-[100vw] sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="h-full flex-1 min-h-0 flex flex-col overflow-hidden"
            >
              <div className="shrink-0 p-4 sm:p-6 pb-0">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Atualize os dados da transação' : 'Cadastre uma nova transação financeira'}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4 w-[96%] mx-auto sm:w-full max-w-[96%] sm:max-w-full min-w-0 overflow-x-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRANSACTION_TYPE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRANSACTION_CATEGORY_OPTIONS
                                .filter(option => option.type === selectedType || option.type === 'both')
                                .map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Cliente</FormLabel>
                        <div className="flex gap-2">
                          <Popover open={clientOpen} onOpenChange={setClientOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={clientOpen}
                                  className="flex-1 w-full justify-between font-normal h-10"
                                >
                                  {selectedClient ? selectedClient.name : "Selecionar cliente..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Buscar cliente..."
                                  value={clientSearch}
                                  onValueChange={setClientSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {filteredClients.map((client) => (
                                      <CommandItem
                                        key={client.id}
                                        value={client.id}
                                        onSelect={() => {
                                          field.onChange(client.id);
                                          setClientOpen(false);
                                          setClientSearch('');
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === client.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {client.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setClientFormOpen(true)}
                            title="Novo cliente"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {field.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => field.onChange(null)}
                              title="Remover cliente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <CapitalizedInput placeholder="Ex: Pagamento de fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRANSACTION_STATUS_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paid_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Pagamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pix">Pix</SelectItem>
                          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="bank_transfer">Transferência</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 mt-4">
                  <FormField
                    control={form.control}
                    name="recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Repetir conta?</FormLabel>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isRecurring && (
                    <FormField
                      control={form.control}
                      name="installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Vezes</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <CapitalizedTextarea
                          placeholder="Observações adicionais..."
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

            <div className="flex gap-3 p-4 sm:p-6 border-t bg-card shrink-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createTransaction.isPending || updateTransaction.isPending}
              >
                {createTransaction.isPending || updateTransaction.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <DeleteTransactionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={async () => {
          if (transaction) {
            await deleteTransaction.mutateAsync(transaction.id);
            setShowDeleteDialog(false);
            onOpenChange(false);
          }
        }}
        transaction={transaction}
      />
    </Dialog >

      <ClientForm
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSubmit={handleCreateClient}
      />
    </>
  );
}



