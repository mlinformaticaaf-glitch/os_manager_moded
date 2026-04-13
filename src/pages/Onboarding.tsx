import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Phone, FileText, MapPin, Hash, ArrowRight, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const onboardingSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  os_initial_number: z.coerce.number().int().min(1, "Numeração inicial deve ser no mínimo 1"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      phone: "",
      document: "",
      address: "",
      os_initial_number: 1,
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get existing service orders count for this user
      const { data: existingOrders, error: countError } = await supabase
        .from("service_orders")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      if (countError) throw countError;

      const existingCount = existingOrders?.length || 0;
      const osNextNumber = data.os_initial_number + existingCount;

      // Update or insert company settings
      const { error: settingsError } = await supabase
        .from("company_settings")
        .update({
          name: data.name,
          phone: data.phone || null,
          document: data.document || null,
          address: data.address || null,
          os_initial_number: data.os_initial_number,
          os_next_number: osNextNumber,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (settingsError) throw settingsError;

      toast({
        title: "Onboarding realizado!",
        description: "Dados da empresa configurados com sucesso.",
      });

      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao completar onboarding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const skipOnboarding = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Mark onboarding as completed with default OS number
      const { error: settingsError } = await supabase
        .from("company_settings")
        .update({
          onboarding_completed: true,
          os_initial_number: 1,
          os_next_number: 1,
        })
        .eq("user_id", user.id);

      if (settingsError) throw settingsError;

      toast({
        title: "Onboarding ignorado",
        description: "Você pode preencher as informações depois em Configurações",
      });

      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Skip onboarding error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao ignorar onboarding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Bem-vindo ao OS Manager
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure as informações da sua empresa para começar
          </p>
        </div>

        {/* Form Cards */}
        <div className="grid gap-6 sm:gap-8">
          {/* Company Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Esses dados aparecerão em documentos e nos seus registros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name - required */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Nome da Empresa *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Minha Assistência Técnica"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 99999-9999"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CNPJ/CPF */}
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CNPJ / CPF
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00.000.000/0001-00"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Endereço
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rua Exemplo, 123 - Bairro - Cidade"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* OS Numbering Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Numeração das Ordens de Serviço
              </CardTitle>
              <CardDescription>
                Se você migrou de outro sistema, defina o número inicial aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="os_initial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Numeração Inicial *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            className="h-11"
                            min="1"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground mt-2">
                          A primeira ordem de serviço começará a partir deste número.
                          Se já existem ordens cadastradas, serão consideradas nesta contagem.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              {/* Preview */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Exemplo de numeração:</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold">
                    {String(form.watch("os_initial_number")).padStart(4, "0")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (4 dígitos, expande se necessário)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  Começar a usar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              onClick={skipOnboarding}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base"
            >
              <X className="w-4 h-4 mr-2" />
              Ignorar
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground">
            Você poderá alterar essas informações depois em Configurações
          </p>
        </div>
      </div>
    </div>
  );
}
