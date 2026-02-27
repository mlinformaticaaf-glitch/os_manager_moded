import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, GripVertical, Tags, Plus, Trash2 } from 'lucide-react';
import { OSDefaultStatus, STATUS_CONFIG, DEFAULT_STATUSES, CUSTOM_STATUS_COLORS } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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

interface StatusRow {
  status_key: string;
  custom_label: string;
  custom_short_label: string;
  position: number;
  is_custom: boolean;
  color: string;
  bg_color: string;
}

export function StatusSettingsCard() {
  const { statusConfig, saveSettings, deleteCustomStatus, canAddMore, customStatusCount } = useStatusSettings();
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  // New status form
  const [newLabel, setNewLabel] = useState('');
  const [newShortLabel, setNewShortLabel] = useState('');
  const [newColorIndex, setNewColorIndex] = useState(0);

  useEffect(() => {
    const allKeys = Object.keys(statusConfig);
    const sorted = allKeys
      .map(key => ({
        status_key: key,
        custom_label: statusConfig[key].label,
        custom_short_label: statusConfig[key].shortLabel,
        position: statusConfig[key].position,
        is_custom: statusConfig[key].isCustom,
        color: statusConfig[key].color,
        bg_color: statusConfig[key].bgColor,
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
      custom_label: r.custom_label.trim() || (DEFAULT_STATUSES.includes(r.status_key as OSDefaultStatus) ? STATUS_CONFIG[r.status_key as OSDefaultStatus].label : r.status_key),
      custom_short_label: r.custom_short_label.trim() || (DEFAULT_STATUSES.includes(r.status_key as OSDefaultStatus) ? STATUS_CONFIG[r.status_key as OSDefaultStatus].shortLabel : r.status_key),
      position: i,
      is_custom: r.is_custom,
      color: r.color,
      bg_color: r.bg_color,
    }));

    saveSettings.mutate(items, {
      onSuccess: () => toast.success('Status personalizados salvos!'),
      onError: () => toast.error('Erro ao salvar status'),
    });
  };

  const generateKey = (label: string) => {
    return 'custom_' + label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 30);
  };

  const handleAddStatus = () => {
    if (!newLabel.trim()) return;
    
    const key = generateKey(newLabel);
    // Check if key already exists
    if (rows.some(r => r.status_key === key)) {
      toast.error('Já existe um status com nome similar');
      return;
    }

    const selectedColor = CUSTOM_STATUS_COLORS[newColorIndex];
    const newRow: StatusRow = {
      status_key: key,
      custom_label: newLabel.trim(),
      custom_short_label: newShortLabel.trim() || newLabel.trim(),
      position: rows.length,
      is_custom: true,
      color: selectedColor.color,
      bg_color: selectedColor.bgColor,
    };

    setRows(prev => [...prev, newRow]);
    setNewLabel('');
    setNewShortLabel('');
    setNewColorIndex(0);
    setAddDialogOpen(false);
    toast.info('Status adicionado. Clique em "Salvar" para confirmar.');
  };

  const handleDeleteCustom = () => {
    if (!deleteKey) return;
    
    // Remove from local rows
    setRows(prev => prev.filter(r => r.status_key !== deleteKey).map((r, i) => ({ ...r, position: i })));
    
    // Delete from database
    deleteCustomStatus.mutate(deleteKey, {
      onSuccess: () => toast.success('Status removido!'),
      onError: () => toast.error('Erro ao remover status'),
    });
    setDeleteKey(null);
  };

  const defaultConfig = (key: string) => {
    if (DEFAULT_STATUSES.includes(key as OSDefaultStatus)) {
      return STATUS_CONFIG[key as OSDefaultStatus];
    }
    const row = rows.find(r => r.status_key === key);
    return row ? { label: row.custom_label, shortLabel: row.custom_short_label, color: row.color, bgColor: row.bg_color } : { label: key, shortLabel: key, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Status das Ordens de Serviço
          </CardTitle>
          <CardDescription>
            Personalize os nomes e a ordem dos status. Arraste para reordenar. Você pode adicionar até 5 status personalizados.
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
                  "grid grid-cols-1 sm:grid-cols-[32px_1fr_1fr_auto] gap-2 p-2.5 rounded-lg border border-border bg-card transition-all",
                  dragIndex === index && "opacity-50 border-primary"
                )}
              >
                <div className="flex items-center gap-2 sm:gap-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <div className={cn(
                    "sm:hidden text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap",
                    row.color || def.color, row.bg_color || def.bgColor
                  )}>
                    {row.is_custom ? '★ ' : ''}{def.label}
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
                      row.color || def.color, row.bg_color || def.bgColor
                    )}>
                      {row.custom_short_label || def.shortLabel}
                    </div>
                  </div>
                </div>

                {/* Delete button for custom statuses */}
                <div className="flex items-center">
                  {row.is_custom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteKey(row.status_key)}
                      title="Remover status personalizado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              disabled={!canAddMore}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Adicionar Status ({customStatusCount}/5)
            </Button>
            <Button onClick={handleSave} disabled={saveSettings.isPending} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saveSettings.isPending ? 'Salvando...' : 'Salvar Status'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Status Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Status Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Em Teste"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome curto (para badges)</Label>
              <Input
                value={newShortLabel}
                onChange={(e) => setNewShortLabel(e.target.value)}
                placeholder="Ex: Teste"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-6 gap-2">
                {CUSTOM_STATUS_COLORS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewColorIndex(i)}
                    className={cn(
                      "h-8 rounded-md border-2 transition-all flex items-center justify-center text-[10px] font-medium",
                      c.bgColor, c.color,
                      newColorIndex === i ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                    )}
                    title={c.label}
                  >
                    {c.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            {/* Preview */}
            {newLabel && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  CUSTOM_STATUS_COLORS[newColorIndex].bgColor,
                  CUSTOM_STATUS_COLORS[newColorIndex].color,
                )}>
                  {newShortLabel || newLabel}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddStatus} disabled={!newLabel.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKey} onOpenChange={(open) => !open && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover status personalizado?</AlertDialogTitle>
            <AlertDialogDescription>
              OS que utilizam este status continuarão com o valor salvo, mas ele não aparecerá mais nos filtros e formulários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
