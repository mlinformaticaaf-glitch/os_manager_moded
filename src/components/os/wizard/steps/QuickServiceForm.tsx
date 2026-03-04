import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CurrencyInput } from '@/components/ui/currency-input';

const quickServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  cost_price: z.coerce.number().min(0, 'Custo deve ser positivo'),
  sale_price: z.coerce.number().min(0, 'Preço deve ser positivo'),
});

type QuickServiceFormData = z.infer<typeof quickServiceSchema>;

interface QuickServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuickServiceFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function QuickServiceForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: QuickServiceFormProps) {
  const form = useForm<QuickServiceFormData>({
    resolver: zodResolver(quickServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      cost_price: 0,
      sale_price: 0,
    },
  });

  const handleSubmit = async (data: QuickServiceFormData) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  const costPrice = form.watch('cost_price');
  const salePrice = form.watch('sale_price');
  const profitMargin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-w-full sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-[80vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <Form {...form}>
          <form
            id="quick-service-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <div className="shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle>Cadastro Rápido de Serviço</DialogTitle>
                <DialogDescription>
                  Cadastre um novo serviço rapidamente
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 pb-0 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <CapitalizedInput placeholder="Nome do serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <CapitalizedTextarea
                          placeholder="Descrição do serviço"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <CapitalizedInput placeholder="Ex: Manutenção" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo</FormLabel>
                        <FormControl>
                          <CurrencyInput value={field.value} onValueChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sale_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda</FormLabel>
                        <FormControl>
                          <CurrencyInput value={field.value} onValueChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Margem de Lucro:</span>
                    <span className={`font-medium ${profitMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {profitMargin.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">Lucro:</span>
                    <span className={`font-medium ${salePrice - costPrice >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {formatCurrency(salePrice - costPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </form>
        </Form>

        <div className="shrink-0 flex gap-3 p-4 sm:p-6 border-t bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button form="quick-service-form" type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : 'Cadastrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
