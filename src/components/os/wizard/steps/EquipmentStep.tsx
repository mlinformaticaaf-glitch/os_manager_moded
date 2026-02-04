import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useEquipment } from '@/hooks/useEquipment';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { formatEquipmentCode } from '@/types/equipment';
import { Search, Plus, Monitor, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Equipment } from '@/types/equipment';

interface EquipmentStepProps {
  selectedEquipmentId: string | null;
  serialNumber: string;
  accessories: string;
  onSelectEquipment: (equipmentId: string | null) => void;
  onChangeSerialNumber: (value: string) => void;
  onChangeAccessories: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EquipmentStep({
  selectedEquipmentId,
  serialNumber,
  accessories,
  onSelectEquipment,
  onChangeSerialNumber,
  onChangeAccessories,
  onNext,
  onBack,
}: EquipmentStepProps) {
  const { equipment: equipmentList, createEquipment, isLoading } = useEquipment();
  const [search, setSearch] = useState('');
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);

  const activeEquipment = equipmentList.filter((e) => e.active);

  const filteredEquipment = useMemo(() => {
    if (!search.trim()) return activeEquipment;
    const query = search.toLowerCase();
    return activeEquipment.filter(
      (e) =>
        e.description.toLowerCase().includes(query) ||
        (e.code && `EQP-${e.code}`.toLowerCase().includes(query))
    );
  }, [activeEquipment, search]);

  const selectedEquipment = equipmentList.find((e) => e.id === selectedEquipmentId);

  const handleCreateEquipment = async (data: { description: string; active: boolean }) => {
    createEquipment.mutate(data, {
      onSuccess: (newEquipment) => {
        onSelectEquipment(newEquipment.id);
        setEquipmentFormOpen(false);
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Qual é o equipamento?</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Selecione ou cadastre o equipamento
        </p>
      </div>

      {/* Selected Equipment Preview */}
      {selectedEquipment && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm sm:text-base">{selectedEquipment.description}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formatEquipmentCode(selectedEquipment.code)}
                </p>
              </div>
              <Check className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setEquipmentFormOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Equipment List */}
      <ScrollArea className="h-[150px] sm:h-[200px] rounded-lg border">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Carregando equipamentos...
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Monitor className="h-8 w-8 mb-2" />
              <p>Nenhum equipamento encontrado</p>
            </div>
          ) : (
            filteredEquipment.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                isSelected={equipment.id === selectedEquipmentId}
                onSelect={() => onSelectEquipment(equipment.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Additional Fields */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="serial_number" className="text-sm">Nº Série (opcional)</Label>
          <CapitalizedInput
            id="serial_number"
            placeholder="Ex: SN123456789"
            value={serialNumber}
            onChange={(e) => onChangeSerialNumber(e.target.value)}
            className="text-sm sm:text-base"
            uppercase
          />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="accessories" className="text-sm">Acessórios (opcional)</Label>
          <CapitalizedInput
            id="accessories"
            placeholder="Ex: CARREGADOR, MOUSE"
            value={accessories}
            onChange={(e) => onChangeAccessories(e.target.value)}
            className="text-sm sm:text-base"
            uppercase
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => {
              onSelectEquipment(null);
              onNext();
            }}
          >
            Pular
          </Button>
          <Button onClick={onNext} size="sm" className="flex-1 sm:flex-none">
            Continuar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <EquipmentForm
        open={equipmentFormOpen}
        onOpenChange={setEquipmentFormOpen}
        equipment={null}
        onSubmit={handleCreateEquipment}
        isSubmitting={createEquipment.isPending}
      />
    </div>
  );
}

function EquipmentCard({
  equipment,
  isSelected,
  onSelect,
}: {
  equipment: Equipment;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 border border-primary"
          : "hover:bg-muted border border-transparent"
      )}
    >
      <div
        className={cn(
          "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm sm:text-base">{equipment.description}</p>
        <p className="text-xs sm:text-sm text-muted-foreground">{formatEquipmentCode(equipment.code)}</p>
      </div>
      {isSelected && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />}
    </button>
  );
}
