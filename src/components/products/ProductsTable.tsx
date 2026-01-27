import { Package, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Product, UNIT_OPTIONS } from '@/types/product';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getUnitLabel = (unit: string | null) => {
  return UNIT_OPTIONS.find(u => u.value === unit)?.label || unit || 'Un';
};

const isLowStock = (product: Product) => {
  return product.stock_quantity <= product.min_stock;
};

function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: (product: Product) => void; onDelete: (product: Product) => void }) {
  const lowStock = isLowStock(product);

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onEdit(product)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{product.name}</p>
              <Badge variant={product.active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                {product.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {product.sku && (
              <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border">
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(product)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Venda</p>
          <p className="font-medium">{formatCurrency(product.sale_price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Margem</p>
          <p className={product.profit_margin >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {product.profit_margin.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estoque</p>
          <div className="flex items-center gap-1">
            {lowStock && <AlertTriangle className="w-3 h-3 text-orange-500" />}
            <span className={lowStock ? 'text-orange-600 font-medium' : 'font-medium'}>
              {product.stock_quantity} {getUnitLabel(product.unit)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  const isMobile = useIsMobile();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
        <p className="text-sm">Cadastre seu primeiro produto clicando no botão acima</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="hidden lg:table-cell">SKU</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead className="text-right hidden lg:table-cell">Custo</TableHead>
            <TableHead className="text-right">Venda</TableHead>
            <TableHead className="text-right hidden md:table-cell">Margem</TableHead>
            <TableHead className="text-center">Estoque</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow 
              key={product.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onEdit(product)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex w-10 h-10 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] hidden md:block">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {product.sku || '-'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {product.category ? (
                  <Badge variant="outline">{product.category}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right hidden lg:table-cell">
                {formatCurrency(product.cost_price)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(product.sale_price)}
              </TableCell>
              <TableCell className="text-right hidden md:table-cell">
                <span className={product.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.profit_margin.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {isLowStock(product) && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  <span className={isLowStock(product) ? 'text-orange-600 font-medium' : ''}>
                    {product.stock_quantity}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <Badge variant={product.active ? 'default' : 'secondary'}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border border-border">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(product)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
