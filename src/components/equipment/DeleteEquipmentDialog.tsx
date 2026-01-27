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
import { Equipment, formatEquipmentCode } from '@/types/equipment';

interface DeleteEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteEquipmentDialog({
  open,
  onOpenChange,
  equipment,
  onConfirm,
  isDeleting,
}: DeleteEquipmentDialogProps) {
  if (!equipment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Equipamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o equipamento{' '}
            <strong>{formatEquipmentCode(equipment.code)}</strong>?
            <br />
            <span className="text-sm text-muted-foreground">
              {equipment.description}
            </span>
            <br /><br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
