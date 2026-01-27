import { Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Equipment, formatEquipmentCode } from '@/types/equipment';

interface EquipmentTableProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

export function EquipmentTable({ equipment, onEdit, onDelete }: EquipmentTableProps) {
  if (equipment.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum equipamento cadastrado.</p>
        <p className="text-sm">Clique em "Novo Equipamento" para adicionar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">
                {formatEquipmentCode(item.code)}
              </TableCell>
              <TableCell className="max-w-[400px]">
                <p className="truncate" title={item.description}>
                  {item.description}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant={item.active ? 'default' : 'secondary'}>
                  {item.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
