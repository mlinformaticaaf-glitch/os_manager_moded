import jsPDF from 'jspdf';
import { Manual, ManualStep } from '@/types/manual';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching image for PDF:", error);
        return "";
    }
};

const getImageDimensions = (base64Img: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = base64Img;
    });
};

export async function exportManualToPDF(manual: Manual, steps: ManualStep[]) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // Header Color/Style
    doc.setFillColor(59, 130, 246); // Primary Color
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(manual.title, margin, 25);

    // Category
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Categoria: ${manual.category || 'Geral'}  |  Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, 33);

    y = 55;

    // Description
    if (manual.description) {
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        const descLines = doc.splitTextToSize(manual.description, contentWidth);
        const descHeight = (descLines.length * 6);

        if (y + descHeight > 270) {
            doc.addPage();
            y = 20;
        }

        doc.text(descLines, margin, y);
        y += descHeight + 10;
    }

    // Divider
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    // Steps
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Ensure enough space for title and some text
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        // Step Title
        doc.setTextColor(59, 130, 246);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Passo ${i + 1}: ${step.title || 'Instruções'}`, margin, y);
        y += 8;

        // Step Description
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const stepDescLines = doc.splitTextToSize(step.description || '', contentWidth);
        doc.text(stepDescLines, margin, y);
        y += (stepDescLines.length * 5) + 8;

        // Step Image
        if (step.image_url) {
            try {
                const base64Img = await getBase64FromUrl(step.image_url);
                if (base64Img) {
                    const dims = await getImageDimensions(base64Img);
                    const aspectRatio = dims.height / dims.width;
                    const imgWidth = contentWidth;
                    const imgHeight = Math.min(imgWidth * aspectRatio, 120);

                    if (y + imgHeight > 270) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.addImage(base64Img, 'JPEG', margin, y, imgWidth, imgHeight);
                    y += imgHeight + 15;
                }
            } catch (e) {
                console.error("Failed to add image to PDF", e);
                y += 5;
            }
        } else {
            y += 5;
        }

        // Small divider between steps
        if (i < steps.length - 1) {
            doc.setDrawColor(245, 245, 245);
            doc.line(margin, y - 5, pageWidth - margin, y - 5);
        }
    }

    // Footer on each page would be nice, but simple for now
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let j = 1; j <= pageCount; j++) {
        doc.setPage(j);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${j} de ${pageCount} - ${manual.title}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Manual_${manual.title.replace(/\s+/g, '_')}.pdf`);
}
