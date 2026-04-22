import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { downloadCsv } from "@/lib/csvExport";

interface ExportButtonProps {
    data: any[];
    filename: string;
    sheetName?: string;
}

const SENSITIVE_EXPORT_KEYS = new Set([
    "device_password",
    "password",
    "senha",
    "access_token",
    "refresh_token",
]);

export function ExportButton({ data, filename, sheetName = "Sheet1" }: ExportButtonProps) {
    const exportToCsv = () => {
        // Basic cleaning of data for export
        const exportData = data.map(item => {
            const cleaned: any = {};
            for (const key in item) {
                if (SENSITIVE_EXPORT_KEYS.has(key)) continue;

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

        const headers = Array.from(
            exportData.reduce((keys, item) => {
                Object.keys(item).forEach((key) => keys.add(key));
                return keys;
            }, new Set<string>())
        );

        // Generate filename with current date
        const date = format(new Date(), "yyyy-MM-dd");
        const fullFilename = `${filename}_${date}.csv`;

        downloadCsv(fullFilename, [
            [sheetName],
            [],
            headers,
            ...exportData.map((item) => headers.map((header) => item[header] ?? "")),
        ]);
    };

    return (
        <Button variant="outline" size="sm" onClick={exportToCsv} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
        </Button>
    );
}
