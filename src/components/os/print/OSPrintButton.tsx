import { ServiceOrder, ServiceOrderItem } from "@/types/serviceOrder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, FileText, Receipt } from "lucide-react";
import { printOSA4, printOSThermal } from "./printOS";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface OSPrintButtonProps {
  order: ServiceOrder;
  items: ServiceOrderItem[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function OSPrintButton({ order, items, variant = "outline", size = "sm" }: OSPrintButtonProps) {
  const { settings } = useCompanySettings();

  const handlePrint = (type: 'a4' | 'thermal') => {
    const printData = {
      order,
      items,
      companyName: settings?.name || 'Assistência Técnica',
      companyPhone: settings?.phone || undefined,
      companyAddress: settings?.address 
        ? `${settings.address}${settings.city ? `, ${settings.city}` : ''}${settings.state ? ` - ${settings.state}` : ''}`
        : undefined,
      companyEmail: settings?.email || undefined,
      companyDocument: settings?.document || undefined,
      logoUrl: settings?.logo_url || undefined,
      warrantyTerms: settings?.warranty_terms || undefined,
      footerMessage: settings?.footer_message || 'Obrigado pela preferência!',
    };

    if (type === 'a4') {
      printOSA4(printData);
    } else {
      printOSThermal(printData);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlePrint('a4')}>
          <FileText className="h-4 w-4 mr-2" />
          Formato A4
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint('thermal')}>
          <Receipt className="h-4 w-4 mr-2" />
          Térmica (58mm)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
