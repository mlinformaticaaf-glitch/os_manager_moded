import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductForm } from '@/components/products/ProductForm';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';

export default function Products() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();

  // Handle navigation state to open a specific product for editing
  useEffect(() => {
    const state = location.state as { viewProductId?: string } | null;
    if (state?.viewProductId && products.length > 0) {
      const productToEdit = products.find(p => p.id === state.viewProductId);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setFormOpen(true);
        // Clear the state to prevent re-opening on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, products]);


  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const searchLower = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        (product.code && `PROD-${product.code}`.toLowerCase().includes(searchLower))
    );
  }, [products, search]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock_quantity <= p.min_stock && p.active);
  }, [products]);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Product, 'id' | 'user_id' | 'profit_margin' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, data });
    } else {
      await createProduct.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (deletingProduct) {
      await deleteProduct.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  return (
    <MainLayout title="Produtos" subtitle="Gerencie seu catálogo de produtos e estoque">
      <div className="space-y-6">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <p className="font-medium text-orange-800 dark:text-orange-400 text-sm sm:text-base">
                {lowStockProducts.length} produto(s) com estoque baixo
              </p>
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-500 truncate">
                {lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                {lowStockProducts.length > 2 && ` e mais ${lowStockProducts.length - 2}`}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ProductsTable
            products={filteredProducts}
            onEdit={handleEdit}
            onDelete={setDeletingProduct}
          />
        )}

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>
            {filteredProducts.length} de {products.length} produto(s)
          </span>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSubmit={handleFormSubmit}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
        onDelete={() => {
          setFormOpen(false);
          setDeletingProduct(editingProduct);
        }}
      />

      {/* Delete Dialog */}
      <DeleteProductDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        product={deletingProduct}
        onConfirm={handleDelete}
        isDeleting={deleteProduct.isPending}
      />
    </MainLayout>
  );
}
