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
import { CurrencyInput } from '@/components/ui/currency-input';
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
  const [activeTab, setActiveTab] = useState<'services' | 'products' | 'manual'>('services');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [manualItem, setManualItem] = useState<WizardItemData>({
    type: 'service',
    description: '',
    quantity: 1,
    unit_price: 0,
  });

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
    active: true;
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

  const handleAddManualItem = () => {
    if (!manualItem.description.trim()) return;
    onAddItem({ ...manualItem });
    setManualItem({
      type: 'service',
      description: '',
      quantity: 1,
      unit_price: 0,
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
        <Card className="border-primary/30 shadow-sm bg-primary/[0.02]">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="font-bold text-sm sm:text-base">Carrinho de Itens</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
            <ScrollArea className="max-h-[140px] sm:max-h-[180px]">
              <div className="space-y-2 pr-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg bg-background border shadow-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {item.type === 'service' ? (
                        <Wrench className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <Package className="h-4 w-4 text-orange-500 shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium truncate flex-1">{item.description}</span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-primary">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-none">
                      <div className="flex items-center bg-muted rounded-md h-7 sm:h-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted-foreground/10"
                          onClick={() =>
                            item.quantity > 1
                              ? onUpdateItemQuantity(index, item.quantity - 1)
                              : onRemoveItem(index)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold w-6 sm:w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted-foreground/10"
                          onClick={() => onUpdateItemQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveItem(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Desconto Total:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">-</span>
                  <CurrencyInput
                    value={discount}
                    onValueChange={onChangeDiscount}
                    className="w-32 h-8"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center bg-primary/10 p-2 sm:p-3 rounded-lg">
                <span className="font-bold text-sm sm:text-base">Valor Total:</span>
                <span className="font-bold text-lg sm:text-xl text-primary font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar serviços ou produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 sm:h-10 text-base"
        />
      </div>

      {/* Tabs for Services/Products */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'services' | 'products' | 'manual')}>
        <TabsList className="w-full h-11 sm:h-10">
          <TabsTrigger value="services" className="flex-1 gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm">
            <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1 gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm">
            <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Avulso
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
            className="w-full mb-2 gap-2 border-dashed h-11 sm:h-9"
            onClick={() => setShowProductForm(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar Novo Produto
          </Button>

          <ScrollArea className="h-[150px] sm:h-[200px] rounded-lg border bg-background">
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

        <TabsContent value="manual" className="mt-3 sm:mt-4">
          <Card className="border-dashed border-2">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Item</label>
                  <Tabs
                    value={manualItem.type}
                    onValueChange={(v) => setManualItem({ ...manualItem, type: v as 'service' | 'product' })}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="service">Serviço</TabsTrigger>
                      <TabsTrigger value="product">Produto</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição do Item</label>
                  <Input
                    placeholder="Ex: Formatação, Cabo HDMI, etc..."
                    value={manualItem.description}
                    onChange={(e) => setManualItem({ ...manualItem, description: e.target.value })}
                    className="h-11 sm:h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={manualItem.quantity}
                      onChange={(e) => setManualItem({ ...manualItem, quantity: Number(e.target.value) })}
                      className="h-11 sm:h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço Unitário</label>
                    <CurrencyInput
                      value={manualItem.unit_price}
                      onValueChange={(val) => setManualItem({ ...manualItem, unit_price: val })}
                      className="h-11 sm:h-10"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddManualItem}
                  disabled={!manualItem.description.trim()}
                  className="w-full h-12 gap-2 mt-2 font-bold"
                >
                  <Plus className="h-5 w-5" />
                  Adicionar Item Avulso
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t mt-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-11 sm:h-9">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="sm:size-default h-12 sm:h-10 font-semibold"
        >
          Revisar e Finalizar
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
