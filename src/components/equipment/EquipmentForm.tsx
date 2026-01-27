import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Equipment } from '@/types/equipment';

const formSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(500, 'Descrição deve ter no máximo 500 caracteres'),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onSubmit: (data: { description: string; active: boolean }) => Promise<void>;
  isSubmitting: boolean;
}

export function EquipmentForm({
  open,
  onOpenChange,
  equipment,
  onSubmit,
  isSubmitting,
}: EquipmentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      active: true,
    },
  });

  useEffect(() => {
    if (equipment) {
      form.reset({
        description: equipment.description,
        active: equipment.active,
      });
    } else {
      form.reset({
        description: '',
        active: true,
      });
    }
  }, [equipment, form]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      description: values.description,
      active: values.active,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Equipamento, Marca e Modelo)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Notebook Dell Inspiron 15 3000"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : equipment ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
