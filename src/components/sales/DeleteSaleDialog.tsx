import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sale } from '@/types/sale';
import { formatSaleNumber } from '@/lib/saleUtils';

interface DeleteSaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteSaleDialog({
    open,
    onOpenChange,
    sale,
    onConfirm,
    isDeleting,
}: DeleteSaleDialogProps) {
    if (!sale) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a venda #{formatSaleNumber(sale.sale_number, sale.created_at)}?
                        Esta ação irá reverter o estoque dos produtos e não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
