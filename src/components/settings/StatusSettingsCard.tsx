import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, GripVertical, Tags } from 'lucide-react';
import { OSStatus, STATUS_CONFIG } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StatusRow {
  status_key: OSStatus;
  custom_label: string;
  custom_short_label: string;
  position: number;
}

const ALL_STATUSES: OSStatus[] = [
  'pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'completed', 'delivered', 'cancelled'
];

export function StatusSettingsCard() {
  const { statusConfig, saveSettings } = useStatusSettings();
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    const sorted = ALL_STATUSES
      .map(key => ({
        status_key: key,
        custom_label: statusConfig[key].label,
        custom_short_label: statusConfig[key].shortLabel,
        position: statusConfig[key].position,
      }))
      .sort((a, b) => a.position - b.position);
    setRows(sorted);
  }, [statusConfig]);

  const updateRow = (index: number, field: 'custom_label' | 'custom_short_label', value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    
    setRows(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated.map((r, i) => ({ ...r, position: i }));
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSave = () => {
    const items = rows.map((r, i) => ({
      status_key: r.status_key,
      custom_label: r.custom_label.trim() || STATUS_CONFIG[r.status_key].label,
      custom_short_label: r.custom_short_label.trim() || STATUS_CONFIG[r.status_key].shortLabel,
      position: i,
    }));

    saveSettings.mutate(items, {
      onSuccess: () => toast.success('Status personalizados salvos!'),
      onError: () => toast.error('Erro ao salvar status'),
    });
  };

  const defaultConfig = (key: OSStatus) => STATUS_CONFIG[key];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Status das Ordens de Serviço
        </CardTitle>
        <CardDescription>
          Personalize os nomes e a ordem dos status. Arraste para reordenar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-[32px_1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-1 hidden sm:grid">
          <span />
          <span>Nome completo</span>
          <span>Nome curto (badges)</span>
          <span className="w-8" />
        </div>

        {rows.map((row, index) => {
          const def = defaultConfig(row.status_key);
          return (
            <div
              key={row.status_key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-[32px_1fr_1fr] gap-2 p-2.5 rounded-lg border border-border bg-card transition-all",
                dragIndex === index && "opacity-50 border-primary"
              )}
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                <div className={cn(
                  "sm:hidden text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap",
                  def.bgColor, def.color
                )}>
                  {def.label}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground sm:hidden">Nome completo</label>
                <Input
                  value={row.custom_label}
                  onChange={(e) => updateRow(index, 'custom_label', e.target.value)}
                  placeholder={def.label}
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground sm:hidden">Nome curto</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={row.custom_short_label}
                    onChange={(e) => updateRow(index, 'custom_short_label', e.target.value)}
                    placeholder={def.shortLabel}
                    className="h-8 text-sm"
                  />
                  <div className={cn(
                    "hidden sm:flex text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0",
                    def.bgColor, def.color
                  )}>
                    {row.custom_short_label || def.shortLabel}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saveSettings.isPending} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saveSettings.isPending ? 'Salvando...' : 'Salvar Status'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
