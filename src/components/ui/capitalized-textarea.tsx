import * as React from "react";
import { cn } from "@/lib/utils";
import { capitalizeWords } from "@/lib/textUtils";

export interface CapitalizedTextareaProps
  extends React.ComponentProps<"textarea"> {
  disableCapitalization?: boolean;
  uppercase?: boolean;
}

const CapitalizedTextarea = React.forwardRef<HTMLTextAreaElement, CapitalizedTextareaProps>(
  ({ className, onChange, onBlur, disableCapitalization = false, uppercase = false, ...props }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!disableCapitalization) {
        const originalValue = e.target.value;
        const transformedValue = uppercase ? originalValue.toUpperCase() : capitalizeWords(originalValue);

        if (originalValue !== transformedValue) {
          // Criar um novo evento com o valor transformado
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(e.target, transformedValue);
          }

          // Dispara o evento change real para sincronizar com formulário (ex: React Hook Form)
          const ev = new Event('input', { bubbles: true });
          e.target.dispatchEvent(ev);
        }
      }

      onBlur?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onChange={onChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
CapitalizedTextarea.displayName = "CapitalizedTextarea";

export { CapitalizedTextarea };
