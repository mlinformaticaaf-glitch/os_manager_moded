import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PDFReportButtonProps {
    title: string;
    data: any[];
    columns: { header: string; dataKey: string }[];
    period: { startDate: Date; endDate: Date };
    filename: string;
}

export function PDFReportButton({ title, data, columns, period, filename }: PDFReportButtonProps) {
    const exportPDF = () => {
        const doc = new jsPDF();
        const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");
        const periodStr = `${format(period.startDate, "dd/MM/yyyy")} até ${format(period.endDate, "dd/MM/yyyy")}`;

        // Header
        doc.setFontSize(18);
        doc.text(title, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Período: ${periodStr}`, 14, 30);
        doc.text(`Gerado em: ${dateStr}`, 14, 35);

        // Table
        autoTable(doc, {
            startY: 45,
            head: [columns.map(col => col.header)],
            body: data.map(row => columns.map(col => {
                const val = row[col.dataKey];
                if (typeof val === 'number') {
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
                }
                return val ?? '-';
            })),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246] }, // Primary color
        });

        doc.save(`${filename}_${format(new Date(), "yyyyMMdd")}.pdf`);
    };

    return (
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            PDF
        </Button>
    );
}
