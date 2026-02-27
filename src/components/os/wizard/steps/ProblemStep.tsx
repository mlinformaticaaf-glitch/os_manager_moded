import { Button } from '@/components/ui/button';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Qual é o problema?</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Descreva o problema relatado</p>
      </div>

      {/* Main Issue */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="reported_issue" className="flex items-center gap-1 text-sm">
          <AlertCircle className="h-4 w-4" />
          Problema Relatado *
        </Label>
        <CapitalizedTextarea
          id="reported_issue"
          placeholder="Descreva o problema..."
          value={reportedIssue}
          onChange={(e) => onChangeReportedIssue(e.target.value)}
          className="min-h-[80px] sm:min-h-[120px] resize-none text-sm sm:text-base"
        />
        {reportedIssue.length > 0 && reportedIssue.length < 5 && (
          <p className="text-xs sm:text-sm text-destructive">Descreva com mais detalhes</p>
        )}
      </div>

      {/* Priority Selection */}
      <div className="space-y-2 sm:space-y-3">
        <Label className="text-sm">Prioridade</Label>
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {(Object.entries(PRIORITY_CONFIG) as [OSPriority, { label: string; color: string }][]).map(
            ([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChangePriority(key)}
                className={cn(
                  "p-2 sm:p-3 rounded-lg border-2 text-center transition-all",
                  priority === key
                    ? "border-primary ring-2 ring-primary/20"
                    : PRIORITY_COLORS[key],
                  "hover:scale-[1.02]"
                )}
              >
                <span className={cn("font-medium text-xs sm:text-sm", config.color)}>{config.label}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Status and Dates */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm">Status Inicial</Label>
          <Select value={status} onValueChange={onChangeStatus}>
            <SelectTrigger className="text-sm sm:text-base">
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
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="estimated_completion" className="text-sm">Previsão de Entrega</Label>
          <Input
            id="estimated_completion"
            type="date"
            value={estimatedCompletion}
            onChange={(e) => onChangeEstimatedCompletion(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="sm">
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
