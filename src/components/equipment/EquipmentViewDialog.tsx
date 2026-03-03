import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Equipment, formatEquipmentCode } from '@/types/equipment';

interface EquipmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onEdit: (equipment: Equipment) => void;
}

export function EquipmentViewDialog({
  open,
  onOpenChange,
  equipment,
  onEdit,
}: EquipmentViewDialogProps) {
  if (!equipment) return null;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(equipment);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-full max-w-full sm:w-[calc(100vw-32px)] h-[100dvh] sm:h-[70vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <div className="shrink-0 p-4 sm:p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{formatEquipmentCode(equipment.code) || 'Equipamento'}</span>
              <Badge variant={equipment.active ? 'default' : 'secondary'}>
                {equipment.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descrição</p>
              <p className="font-medium whitespace-pre-wrap">{equipment.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {format(new Date(equipment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última atualização</p>
                <p className="font-medium">
                  {format(new Date(equipment.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
            <div className="flex justify-end pt-2 sm:hidden pb-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
