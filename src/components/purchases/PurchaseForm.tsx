import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, PackagePlus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { PurchaseItem, PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/types/purchase';
import { QuickProductForm, QuickProductFormData } from './QuickProductForm';

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
  editingPurchase?: {
    id: string;
    supplier_id: string | null;
    invoice_number: string | null;
    purchase_date: string;
    due_date: string | null;
    discount: number;
    shipping: number;
    payment_status: string;
    payment_method: string | null;
    notes: string | null;
  } | null;
  editingItems?: Omit<PurchaseItem, 'id' | 'purchase_id'>[];
}

export function PurchaseForm({ open, onOpenChange, onSubmit, isSubmitting, editingPurchase, editingItems }: PurchaseFormProps) {
  const { suppliers } = useSuppliers();
  const { products, createProduct } = useProducts();
  const [items, setItems] = useState<Omit<PurchaseItem, 'id' | 'purchase_id'>[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quickProductOpen, setQuickProductOpen] = useState(false);

  const isEditing = !!editingPurchase;

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
      if (editingPurchase) {
        form.reset({
          supplier_id: editingPurchase.supplier_id || '',
          invoice_number: editingPurchase.invoice_number || '',
          purchase_date: editingPurchase.purchase_date,
          due_date: editingPurchase.due_date || '',
          discount: editingPurchase.discount,
          shipping: editingPurchase.shipping,
          payment_status: editingPurchase.payment_status,
          payment_method: editingPurchase.payment_method || '',
          notes: editingPurchase.notes || '',
        });
        setItems(editingItems || []);
      } else {
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
      }
      setSelectedProductId('');
    }
  }, [open, form, editingPurchase, editingItems]);

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

  const handleQuickProductSubmit = async (data: QuickProductFormData) => {
    const newProduct = await createProduct.mutateAsync({
      name: data.name,
      description: null,
      category: data.category || null,
      cost_price: data.cost_price,
      sale_price: data.sale_price,
      stock_quantity: data.stock_quantity,
      min_stock: data.min_stock,
      unit: data.unit,
      active: true,
    });

    // Add the new product to the purchase items
    if (newProduct) {
      setItems([...items, {
        product_id: newProduct.id,
        product_name: newProduct.name,
        quantity: 1,
        unit_price: newProduct.cost_price,
        total: newProduct.cost_price,
      }]);
    }

    setQuickProductOpen(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full max-w-full sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-[95vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <Form {...form}>
          <form
            id="purchase-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <div className="shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Atualize os dados da compra' : 'Registre uma nova compra de produtos'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 pb-0 space-y-6">
                {/* Supplier and Invoice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuickProductOpen(true)}>
                        <PackagePlus className="h-4 w-4 mr-1" />
                        Novo Produto
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Item Manual
                      </Button>
                    </div>
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
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2">
                              <CapitalizedInput
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <FormItem className="pb-8">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <CapitalizedTextarea placeholder="Informações adicionais..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
          </form>
        </Form>

        <div className="shrink-0 flex gap-3 p-4 sm:p-6 border-t bg-muted/20">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button form="purchase-form" type="submit" className="flex-1" disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Registrar Compra'}
          </Button>
        </div>

        {/* Quick Product Form Modal */}
        <QuickProductForm
          open={quickProductOpen}
          onOpenChange={setQuickProductOpen}
          onSubmit={handleQuickProductSubmit}
          isSubmitting={createProduct.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
