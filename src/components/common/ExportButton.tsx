import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportButtonProps {
    data: any[];
    filename: string;
    sheetName?: string;
}

export function ExportButton({ data, filename, sheetName = "Sheet1" }: ExportButtonProps) {
    const exportToExcel = () => {
        // Basic cleaning of data for export
        const exportData = data.map(item => {
            const cleaned: any = {};
            for (const key in item) {
                // Skip objects (like client, items) but keep their names if available
                if (typeof item[key] === 'object' && item[key] !== null) {
                    if (item[key].name) cleaned[key] = item[key].name;
                    else if (item[key].description) cleaned[key] = item[key].description;
                    else continue;
                } else {
                    cleaned[key] = item[key];
                }
            }
            return cleaned;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generate filename with current date
        const date = format(new Date(), "yyyy-MM-dd");
        const fullFilename = `${filename}_${date}.xlsx`;

        XLSX.writeFile(workbook, fullFilename);
    };

    return (
        <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
        </Button>
    );
}
