import { Sale, SaleItem } from "@/types/sale";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, FileText, Receipt } from "lucide-react";
import { printSaleA4, printSaleThermal } from "./printSale";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface SalePrintButtonProps {
    sale: Sale;
    items: SaleItem[];
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "icon";
    className?: string;
}

export function SalePrintButton({ sale, items, variant = "outline", size = "sm", className }: SalePrintButtonProps) {
    const { settings } = useCompanySettings();

    const handlePrint = (type: 'a4' | 'thermal') => {
        const printData = {
            sale,
            items,
            companyName: settings?.name || 'Sistema de Vendas',
            companyPhone: settings?.phone || undefined,
            companyAddress: settings?.address
                ? `${settings.address}${settings.city ? `, ${settings.city}` : ''}${settings.state ? ` - ${settings.state}` : ''}`
                : undefined,
            companyEmail: settings?.email || undefined,
            companyDocument: settings?.document || undefined,
            logoUrl: settings?.logo_url || undefined,
            footerMessage: settings?.footer_message || 'Obrigado pela preferência!',
        };

        if (type === 'a4') {
            printSaleA4(printData);
        } else {
            printSaleThermal(printData);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePrint('a4')}>
                    <FileText className="h-4 w-4 mr-2" />
                    A4 - Comprovante
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint('thermal')}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Térmica (58mm)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
