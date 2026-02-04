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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Loader2, X, Camera } from 'lucide-react';
import { Boleto, PAYMENT_METHODS } from '@/types/boleto';
import { useBoletos } from '@/hooks/useBoletos';
import { format } from 'date-fns';

const paymentSchema = z.object({
  paid_date: z.string().min(1, 'Data do pagamento é obrigatória'),
  amount_paid: z.string().min(1, 'Valor pago é obrigatório'),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boleto: Boleto | null;
}

export function PaymentDialog({ open, onOpenChange, boleto }: PaymentDialogProps) {
  const { registerPayment, uploadReceipt, isRegistering } = useBoletos();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paid_date: format(new Date(), 'yyyy-MM-dd'),
      amount_paid: boleto?.amount?.toString() ?? '',
      payment_method: '',
      notes: '',
    },
  });

  // Reset form when boleto changes
  if (boleto && form.getValues('amount_paid') !== boleto.amount.toString()) {
    form.reset({
      paid_date: format(new Date(), 'yyyy-MM-dd'),
      amount_paid: boleto.amount.toString(),
      payment_method: '',
      notes: '',
    });
  }

  const handleSubmit = async (data: PaymentFormData) => {
    if (!boleto) return;

    try {
      let receiptUrl: string | null = null;

      if (receiptFile) {
        setIsUploading(true);
        receiptUrl = await uploadReceipt(receiptFile);
        setIsUploading(false);
      }

      await registerPayment({
        boletoId: boleto.id,
        payment: {
          paid_date: data.paid_date,
          amount_paid: parseFloat(data.amount_paid.replace(',', '.')),
          payment_method: data.payment_method || null,
          notes: data.notes || null,
          receipt_url: receiptUrl,
        },
      });

      form.reset();
      setReceiptFile(null);
      onOpenChange(false);
    } catch (error) {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const isLoading = isRegistering || isUploading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        {boleto && (
          <div className="p-3 bg-muted rounded-lg mb-4">
            <p className="font-medium">{boleto.issuer_name}</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(Number(boleto.amount))}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paid_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Upload */}
            <div className="space-y-2">
              <FormLabel>Comprovante de Pagamento</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('receipt-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {receiptFile ? receiptFile.name : 'Anexar Comprovante'}
                </Button>
                {receiptFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setReceiptFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Aceita imagens ou PDF do comprovante
              </p>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o pagamento..."
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
                Confirmar Pagamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
