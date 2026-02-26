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
  description: z.string().optional(),
  category: z.string().optional(),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
  stock_quantity: z.coerce.number().min(0, 'Quantidade deve ser positiva'),
  min_stock: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo'),
  unit: z.string().default('un'),
});

type QuickProductFormData = z.infer<typeof quickProductSchema>;

interface QuickProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuickProductFormData) => Promise<void>;
  isSubmitting: boolean;
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
      description: '',
      category: '',
      cost_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      min_stock: 0,
      unit: 'un',
    },
  });

  const handleSubmit = async (data: QuickProductFormData) => {
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
      <DialogContent className="sm:max-w-md w-[calc(100vw-16px)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Cadastro Rápido de Produto</DialogTitle>
          <DialogDescription>
            Cadastre um novo produto rapidamente
          </DialogDescription>
        </DialogHeader>

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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <CapitalizedTextarea 
                      placeholder="Descrição do produto" 
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
                    <CapitalizedInput placeholder="Categoria" {...field} />
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
                    <FormLabel>Preço de Custo</FormLabel>
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

            <div className="p-3 bg-muted rounded-lg">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          <SelectValue placeholder="Un." />
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
