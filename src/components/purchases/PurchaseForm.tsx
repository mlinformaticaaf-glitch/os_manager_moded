import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { PurchaseItem, PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/types/purchase';

const purchaseSchema = z.object({
  supplier_id: z.string().optional(),
  invoice_number: z.string().optional(),
  purchase_date: z.string().min(1, 'Data é obrigatória'),
  due_date: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
  shipping: z.coerce.number().min(0).default(0),
  payment_status: z.string().default('pending'),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { purchase: PurchaseFormData & { subtotal: number; total: number }; items: Omit<PurchaseItem, 'id' | 'purchase_id'>[] }) => void;
  isSubmitting: boolean;
}

export function PurchaseForm({ open, onOpenChange, onSubmit, isSubmitting }: PurchaseFormProps) {
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const [items, setItems] = useState<Omit<PurchaseItem, 'id' | 'purchase_id'>[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: '',
      invoice_number: '',
      purchase_date: new Date().toISOString().split('T')[0],
      due_date: '',
      discount: 0,
      shipping: 0,
      payment_status: 'pending',
      payment_method: '',
      notes: '',
    },
  });

  const discount = form.watch('discount') || 0;
  const shipping = form.watch('shipping') || 0;

  useEffect(() => {
    if (open) {
      form.reset({
        supplier_id: '',
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        due_date: '',
        discount: 0,
        shipping: 0,
        payment_status: 'pending',
        payment_method: '',
        notes: '',
      });
      setItems([]);
      setSelectedProductId('');
    }
  }, [open, form]);

  const addProductFromCatalog = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.cost_price,
        total: product.cost_price,
      }]);
      setSelectedProductId('');
    }
  };

  const addManualItem = () => {
    setItems([...items, {
      product_id: null,
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount + shipping;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSubmit = (data: PurchaseFormData) => {
    if (items.length === 0) {
      return;
    }

    onSubmit({
      purchase: {
        ...data,
        supplier_id: data.supplier_id || null,
        invoice_number: data.invoice_number || null,
        due_date: data.due_date || null,
        payment_method: data.payment_method || null,
        notes: data.notes || null,
        subtotal,
        total,
      },
      items,
    });
  };

  const activeSuppliers = suppliers.filter(s => s.active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Compra</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Registre uma nova compra de produtos
          </p>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
            {/* Supplier and Invoice */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
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
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Fiscal</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da NF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Compra *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Produtos</h3>
                <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Item Manual
                </Button>
              </div>

              {/* Add from catalog */}
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={addProductFromCatalog}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Adicionar produto do catálogo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.active).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.cost_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items list */}
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum produto adicionado
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <div className="col-span-2">
                          <Input
                            placeholder="Produto"
                            value={item.product_name}
                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Valor"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-medium">{formatCurrency(item.total)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frete (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Desconto</span>
                <span className="text-destructive">-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frete</span>
                <span>+{formatCurrency(shipping)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUS_OPTIONS.map((option) => (
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
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Informações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || items.length === 0}>
                {isSubmitting ? 'Salvando...' : 'Registrar Compra'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
