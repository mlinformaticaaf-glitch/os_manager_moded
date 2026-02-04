import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { Boleto } from '@/types/boleto';
import { useBoletos } from '@/hooks/useBoletos';

const boletoSchema = z.object({
  issuer_name: z.string().min(1, 'Nome do emissor é obrigatório'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  barcode: z.string().optional(),
  notes: z.string().optional(),
});

type BoletoFormData = z.infer<typeof boletoSchema>;

interface BoletoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBoleto?: Boleto | null;
}

export function BoletoForm({ open, onOpenChange, editingBoleto }: BoletoFormProps) {
  const { createBoleto, updateBoleto, uploadPdf, isCreating, isUpdating } = useBoletos();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const form = useForm<BoletoFormData>({
    resolver: zodResolver(boletoSchema),
    defaultValues: {
      issuer_name: editingBoleto?.issuer_name ?? '',
      amount: editingBoleto?.amount?.toString() ?? '',
      due_date: editingBoleto?.due_date ?? '',
      barcode: editingBoleto?.barcode ?? '',
      notes: editingBoleto?.notes ?? '',
    },
  });

  const handleSubmit = async (data: BoletoFormData) => {
    try {
      let pdfUrl = editingBoleto?.pdf_url ?? null;

      if (pdfFile) {
        setIsUploading(true);
        pdfUrl = await uploadPdf(pdfFile);
        setIsUploading(false);
      }

      const boletoData = {
        issuer_name: data.issuer_name,
        amount: parseFloat(data.amount.replace(',', '.')),
        due_date: data.due_date,
        barcode: data.barcode || null,
        notes: data.notes || null,
        pdf_url: pdfUrl,
        status: 'pending' as const,
      };

      if (editingBoleto) {
        await updateBoleto({ id: editingBoleto.id, ...boletoData });
      } else {
        await createBoleto(boletoData);
      }

      form.reset();
      setPdfFile(null);
      onOpenChange(false);
    } catch (error) {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  };

  const handleScanBarcode = () => {
    setShowScanner(true);
    // Simulate barcode scanning
    setTimeout(() => {
      const simulatedBarcode = '23793.38128 60000.000003 00000.000402 1 84340000010000';
      form.setValue('barcode', simulatedBarcode);
      setShowScanner(false);
    }, 2000);
  };

  const isLoading = isCreating || isUpdating || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="issuer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Emissor *</FormLabel>
                  <FormControl>
                    <CapitalizedInput
                      placeholder="Ex: Fornecedor XYZ"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linha Digitável</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="Digite ou escaneie o código de barras"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleScanBarcode}
                      disabled={showScanner}
                    >
                      {showScanner ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showScanner && (
              <div className="relative aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg" />
                <div className="absolute w-full h-0.5 bg-red-500 animate-pulse" />
                <p className="text-white text-sm">Escaneando código de barras...</p>
              </div>
            )}

            {/* PDF Upload */}
            <div className="space-y-2">
              <FormLabel>Arquivo do Boleto (PDF)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {pdfFile ? pdfFile.name : 'Selecionar PDF'}
                </Button>
                {pdfFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPdfFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBoleto ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
