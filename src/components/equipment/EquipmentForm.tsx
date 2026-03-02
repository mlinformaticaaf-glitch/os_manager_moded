import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
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
      <DialogContent className="sm:max-w-lg w-full max-w-full sm:w-[calc(100vw-16px)] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-none sm:rounded-lg">
        <div className="shrink-0 p-4 sm:p-6 pb-0">
          <DialogHeader>
            <DialogTitle>
              {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
            </DialogTitle>
            <DialogDescription>
              {equipment ? 'Atualize as informações do equipamento' : 'Preencha os dados do novo equipamento'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Equipamento, Marca e Modelo) *</FormLabel>
                      <FormControl>
                        <CapitalizedTextarea
                          placeholder="Ex: NOTEBOOK DELL INSPIRON 15 3000"
                          className="min-h-[100px] resize-none"
                          uppercase
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Equipamento Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Equipamentos inativos não aparecem na seleção de OS
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-6 pb-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : equipment ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
