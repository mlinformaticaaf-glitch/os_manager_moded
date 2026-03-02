import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceOrder } from "@/types/serviceOrder";
import { STATUS_CONFIG } from "@/types/serviceOrder";

export function exportOSReportPDF(orders: ServiceOrder[]) {
    const doc = new jsPDF();
    const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");

    // Header
    doc.setFontSize(18);
    doc.text('Relatório de Ordens de Serviço', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total de registros: ${orders.length}`, 14, 30);
    doc.text(`Gerado em: ${dateStr}`, 14, 35);

    const tableData = orders.map(os => [
        String(os.order_number),
        os.client?.name || '-',
        os.equipment || '-',
        (STATUS_CONFIG[os.status as keyof typeof STATUS_CONFIG] || { label: os.status }).label,
        format(new Date(os.created_at), "dd/MM/yyyy"),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.total)
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Nº', 'Cliente', 'Equipamento', 'Status', 'Data', 'Total']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
            0: { cellWidth: 15 },
            5: { halign: 'right' }
        }
    });

    doc.save(`Relatorio_OS_${format(new Date(), "yyyyMMdd")}.pdf`);
}
