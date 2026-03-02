import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UNIT_OPTIONS } from '@/types/product';

const quickProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().optional(),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
  stock_quantity: z.coerce.number().min(0, 'Quantidade deve ser positiva').default(0),
  min_stock: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo').default(0),
  unit: z.string().default('un'),
});

export type QuickProductFormData = z.infer<typeof quickProductSchema>;

interface QuickProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuickProductFormData) => void;
  isSubmitting?: boolean;
}

export function QuickProductForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: QuickProductFormProps) {
  const form = useForm<QuickProductFormData>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: {
      name: '',
      category: '',
      cost_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      min_stock: 0,
      unit: 'un',
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (data: QuickProductFormData) => {
    onSubmit(data);
    form.reset();
  };

  const costPrice = form.watch('cost_price');
  const salePrice = form.watch('sale_price');
  const profitMargin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-w-full sm:w-[calc(100vw-16px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <div className="shrink-0 p-4 sm:p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            <p className="text-sm text-muted-foreground">
              O código será gerado automaticamente (PROD-X)
            </p>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <CapitalizedInput placeholder="Nome do produto" {...field} />
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
                        <CapitalizedInput placeholder="Categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
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
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {costPrice > 0 && (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    <span className="text-muted-foreground">Margem: </span>
                    <span className={profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {profitMargin.toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Mínimo</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNIT_OPTIONS.map((option) => (
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

                <div className="flex gap-3 pt-6 pb-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Salvando...' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
