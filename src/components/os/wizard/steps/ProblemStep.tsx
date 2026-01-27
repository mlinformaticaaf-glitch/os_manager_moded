import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_CONFIG, PRIORITY_CONFIG, OSStatus, OSPriority } from '@/types/serviceOrder';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProblemStepProps {
  reportedIssue: string;
  status: OSStatus;
  priority: OSPriority;
  estimatedCompletion: string;
  onChangeReportedIssue: (value: string) => void;
  onChangeStatus: (value: OSStatus) => void;
  onChangePriority: (value: OSPriority) => void;
  onChangeEstimatedCompletion: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRIORITY_COLORS: Record<OSPriority, string> = {
  low: 'border-slate-300 bg-slate-50',
  normal: 'border-blue-300 bg-blue-50',
  high: 'border-orange-300 bg-orange-50',
  urgent: 'border-red-300 bg-red-50',
};

export function ProblemStep({
  reportedIssue,
  status,
  priority,
  estimatedCompletion,
  onChangeReportedIssue,
  onChangeStatus,
  onChangePriority,
  onChangeEstimatedCompletion,
  onNext,
  onBack,
}: ProblemStepProps) {
  const isValid = reportedIssue.trim().length >= 5;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Qual é o problema?</h2>
        <p className="text-muted-foreground">Descreva o problema relatado pelo cliente</p>
      </div>

      {/* Main Issue */}
      <div className="space-y-2">
        <Label htmlFor="reported_issue" className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Problema Relatado *
        </Label>
        <Textarea
          id="reported_issue"
          placeholder="Descreva detalhadamente o problema que o cliente relatou..."
          value={reportedIssue}
          onChange={(e) => onChangeReportedIssue(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        {reportedIssue.length > 0 && reportedIssue.length < 5 && (
          <p className="text-sm text-destructive">Descreva o problema com mais detalhes</p>
        )}
      </div>

      {/* Priority Selection */}
      <div className="space-y-3">
        <Label>Prioridade</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(PRIORITY_CONFIG) as [OSPriority, { label: string; color: string }][]).map(
            ([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChangePriority(key)}
                className={cn(
                  "p-3 rounded-lg border-2 text-center transition-all",
                  priority === key
                    ? "border-primary ring-2 ring-primary/20"
                    : PRIORITY_COLORS[key],
                  "hover:scale-[1.02]"
                )}
              >
                <span className={cn("font-medium", config.color)}>{config.label}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Status and Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status Inicial</Label>
          <Select value={status} onValueChange={onChangeStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_completion">Previsão de Entrega</Label>
          <Input
            id="estimated_completion"
            type="date"
            value={estimatedCompletion}
            onChange={(e) => onChangeEstimatedCompletion(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
