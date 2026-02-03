import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { WizardItemData } from '../types';
import { QuickServiceForm } from './QuickServiceForm';
import { QuickProductForm } from './QuickProductForm';
import {
  Search,
  Plus,
  Minus,
  Package,
  Wrench,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServicesStepProps {
  items: WizardItemData[];
  discount: number;
  onAddItem: (item: WizardItemData) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemQuantity: (index: number, quantity: number) => void;
  onChangeDiscount: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ServicesStep({
  items,
  discount,
  onAddItem,
  onRemoveItem,
  onUpdateItemQuantity,
  onChangeDiscount,
  onNext,
  onBack,
}: ServicesStepProps) {
  const { products, createProduct } = useProducts();
  const { services, createService } = useServices();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  const activeProducts = products.filter((p) => p.active);
  const activeServices = services.filter((s) => s.active);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return activeServices;
    const query = search.toLowerCase();
    return activeServices.filter(
      (s) =>
        s.name.toLowerCase().includes(query) || s.code?.toLowerCase().includes(query)
    );
  }, [activeServices, search]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return activeProducts;
    const query = search.toLowerCase();
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
  }, [activeProducts, search]);

  const totalServices = items
    .filter((i) => i.type === 'service')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const totalProducts = items
    .filter((i) => i.type === 'product')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const total = Math.max(0, totalServices + totalProducts - discount);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAddService = (service: (typeof activeServices)[0]) => {
    const existingIndex = items.findIndex(
      (i) => i.type === 'service' && i.description === service.name
    );
    if (existingIndex >= 0) {
      onUpdateItemQuantity(existingIndex, items[existingIndex].quantity + 1);
    } else {
      onAddItem({
        type: 'service',
        description: service.name,
        quantity: 1,
        unit_price: service.sale_price,
      });
    }
  };

  const handleAddProduct = (product: (typeof activeProducts)[0]) => {
    const existingIndex = items.findIndex(
      (i) => i.type === 'product' && i.description === product.name
    );
    if (existingIndex >= 0) {
      onUpdateItemQuantity(existingIndex, items[existingIndex].quantity + 1);
    } else {
      onAddItem({
        type: 'product',
        description: product.name,
        quantity: 1,
        unit_price: product.sale_price,
        product_id: product.id,
      });
    }
  };

  const handleCreateService = async (data: {
    name: string;
    description?: string;
    category?: string;
    cost_price: number;
    sale_price: number;
  }) => {
    await createService.mutateAsync({
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      cost_price: data.cost_price,
      sale_price: data.sale_price,
      code: null,
      estimated_time: null,
      active: true,
    });
  };

  const handleCreateProduct = async (data: {
    name: string;
    description?: string;
    category?: string;
    cost_price: number;
    sale_price: number;
    stock_quantity: number;
    min_stock: number;
    unit: string;
  }) => {
    await createProduct.mutateAsync({
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      cost_price: data.cost_price,
      sale_price: data.sale_price,
      stock_quantity: data.stock_quantity,
      min_stock: data.min_stock,
      unit: data.unit,
      active: true,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Serviços e Produtos</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Adicione serviços e produtos</p>
      </div>

      {/* Cart Summary */}
      {items.length > 0 && (
        <Card className="border-primary/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">Itens ({items.length})</span>
            </div>
            <ScrollArea className="max-h-[120px] sm:max-h-[150px]">
              <div className="space-y-1.5 sm:space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/50"
                  >
                    {item.type === 'service' ? (
                      <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                    ) : (
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                    )}
                    <span className="flex-1 text-xs sm:text-sm truncate">{item.description}</span>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6"
                        onClick={() =>
                          item.quantity > 1
                            ? onUpdateItemQuantity(index, item.quantity - 1)
                            : onRemoveItem(index)
                        }
                      >
                        <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                      <span className="text-xs sm:text-sm w-5 sm:w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6"
                        onClick={() => onUpdateItemQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                    <span className="text-xs sm:text-sm font-medium w-16 sm:w-20 text-right">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-destructive"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator className="my-2 sm:my-3" />
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviços:</span>
                <span>{formatCurrency(totalServices)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produtos:</span>
                <span>{formatCurrency(totalProducts)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Desconto:</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => onChangeDiscount(Number(e.target.value))}
                  className="w-20 sm:w-24 h-6 sm:h-7 text-right text-xs sm:text-sm"
                />
              </div>
              <Separator className="my-1.5 sm:my-2" />
              <div className="flex justify-between font-semibold text-sm sm:text-base">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 text-sm sm:text-base"
        />
      </div>

      {/* Tabs for Services/Products */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'services' | 'products')}>
        <TabsList className="w-full h-9 sm:h-10">
          <TabsTrigger value="services" className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-3 sm:mt-4">
          {/* Add New Service Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mb-2 gap-2 border-dashed"
            onClick={() => setShowServiceForm(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar Novo Serviço
          </Button>

          <ScrollArea className="h-[150px] sm:h-[200px] rounded-lg border">
            <div className="p-1.5 sm:p-2 space-y-1">
              {filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-muted-foreground">
                  <Wrench className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                  <p className="text-sm">Nenhum serviço</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowServiceForm(true)}
                  >
                    Cadastrar primeiro serviço
                  </Button>
                </div>
              ) : (
                filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleAddService(service)}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left hover:bg-muted transition-colors"
                  >
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">{service.name}</p>
                      {service.code && (
                        <p className="text-xs text-muted-foreground">{service.code}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary text-sm sm:text-base">
                        {formatCurrency(service.sale_price)}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="products" className="mt-3 sm:mt-4">
          {/* Add New Product Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mb-2 gap-2 border-dashed"
            onClick={() => setShowProductForm(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar Novo Produto
          </Button>

          <ScrollArea className="h-[150px] sm:h-[200px] rounded-lg border">
            <div className="p-1.5 sm:p-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-muted-foreground">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                  <p className="text-sm">Nenhum produto</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowProductForm(true)}
                  >
                    Cadastrar primeiro produto
                  </Button>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left hover:bg-muted transition-colors"
                  >
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">{product.name}</p>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {product.category && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5">
                            {product.category}
                          </Badge>
                        )}
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          Est: {product.stock_quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary text-sm sm:text-base">
                        {formatCurrency(product.sale_price)}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} size="sm">
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Quick Service Form */}
      <QuickServiceForm
        open={showServiceForm}
        onOpenChange={setShowServiceForm}
        onSubmit={handleCreateService}
        isSubmitting={createService.isPending}
      />

      {/* Quick Product Form */}
      <QuickProductForm
        open={showProductForm}
        onOpenChange={setShowProductForm}
        onSubmit={handleCreateProduct}
        isSubmitting={createProduct.isPending}
      />
    </div>
  );
}
