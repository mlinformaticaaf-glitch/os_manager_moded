import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Product, UNIT_OPTIONS, formatProductCode } from '@/types/product';

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
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {product 
              ? `Código: ${formatProductCode(product.code)} • Atualize as informações do produto`
              : 'O código será gerado automaticamente'}
          </p>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
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
                    <Textarea placeholder="Descrição do produto" {...field} />
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
                    <Input placeholder="Categoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                <span className={`font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Lucro por unidade:</span>
                <span className={`font-medium ${salePrice - costPrice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(salePrice - costPrice)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                {isSubmitting ? 'Salvando...' : product ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
