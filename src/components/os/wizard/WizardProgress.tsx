import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardStep, WIZARD_STEPS } from './types';

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}

export function WizardProgress({ currentStep, completedSteps }: WizardProgressProps) {
  const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full">
      {/* Mobile: compact horizontal progress */}
      <div className="flex items-center justify-between sm:hidden">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-6 mx-1",
                    completedSteps.includes(WIZARD_STEPS[index + 1]?.id) || currentIndex > index
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-2 sm:hidden">
        {WIZARD_STEPS[currentIndex]?.description}
      </p>

      {/* Desktop: full progress with labels */}
      <div className="hidden sm:flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-4",
                    completedSteps.includes(WIZARD_STEPS[index + 1]?.id) || currentIndex > index
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
