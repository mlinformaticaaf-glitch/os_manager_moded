import { useEffect } from 'react';
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
import { CurrencyInput } from '@/components/ui/currency-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Product, UNIT_OPTIONS, formatProductCode } from '@/types/product';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().optional(),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
  stock_quantity: z.coerce.number().min(0, 'Quantidade deve ser positiva'),
  min_stock: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo'),
  unit: z.string().default('un'),
  active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: ProductFormData) => void;
  isSubmitting?: boolean;
  onDelete?: () => void;
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  isSubmitting,
  onDelete,
}: ProductFormProps) {
  useMobileBackButton(open, () => onOpenChange(false));

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      cost_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      min_stock: 0,
      unit: 'un',
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          description: product.description || '',
          category: product.category || '',
          cost_price: product.cost_price,
          sale_price: product.sale_price,
          stock_quantity: product.stock_quantity,
          min_stock: product.min_stock,
          unit: product.unit || 'un',
          active: product.active,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          category: '',
          cost_price: 0,
          sale_price: 0,
          stock_quantity: 0,
          min_stock: 0,
          unit: 'un',
          active: true,
        });
      }
    }
  }, [open, product, form]);

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data);
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
      <DialogContent className="sm:max-w-lg w-full max-w-[100vw] sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 min-h-0 flex flex-col">
            <DialogHeader className="shrink-0 p-4 sm:p-6 border-b">
              <DialogTitle>
                {product ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {product
                  ? `Código: ${formatProductCode(product.code)} • Atualize as informações do produto`
                  : 'O código será gerado automaticamente'}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-4 w-[96%] mx-auto sm:w-full max-w-[96%] sm:max-w-full min-w-0 overflow-x-hidden">
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
                          rows={3}
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

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Margem de Lucro:</span>
                    <span className={`font-medium ${profitMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {profitMargin.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">Lucro por unidade:</span>
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
                        <FormLabel>Estoque Atual</FormLabel>
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
                        <FormLabel>Estoque Mínimo</FormLabel>
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
                              <SelectValue placeholder="Selecione" />
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

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Produto Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Produtos inativos não aparecem na seleção de OS
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <div className="shrink-0 flex flex-wrap gap-3 p-4 sm:p-6 border-t bg-muted/20 justify-end">
              {product && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  Excluir
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                {isSubmitting ? 'Salvando...' : product ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}



