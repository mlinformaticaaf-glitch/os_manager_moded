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
import { Boleto } from '@/types/boleto';

interface DeleteBoletoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boleto: Boleto | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteBoletoDialog({
  open,
  onOpenChange,
  boleto,
  onConfirm,
  isDeleting,
}: DeleteBoletoDialogProps) {
  if (!boleto) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Boleto</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o boleto de{' '}
            <strong>{boleto.issuer_name}</strong> no valor de{' '}
            <strong>{formatCurrency(Number(boleto.amount))}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e também excluirá o comprovante de
            pagamento, se houver.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
