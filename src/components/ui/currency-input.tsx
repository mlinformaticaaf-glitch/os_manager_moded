import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onValueChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onValueChange, className, ...props }, ref) => {
        // Current value for display, formatted to BRL style (comma as decimal separator)
        const formattedValue = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value || 0);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Get only digits
            const digits = e.target.value.replace(/\D/g, "");
            // Convert to number (last two digits are decimals)
            const newValue = parseInt(digits, 10) / 100 || 0;
            onValueChange(newValue);
        };

        return (
            <div className="relative w-full group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none text-xs font-bold transition-colors group-focus-within:text-primary">
                    R$
                </span>
                <Input
                    {...props}
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    value={formattedValue}
                    onChange={handleChange}
                    className={cn("pl-9 font-mono text-right font-medium", className)}
                />
            </div>
        );
    }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
