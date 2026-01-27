import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Upload, Trash2, Save, Phone, Mail, MapPin, FileText, QrCode } from "lucide-react";
import { PIX_KEY_TYPES } from "@/components/os/pix/pixUtils";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { DataImportCard } from "@/components/settings/DataImportCard";

const settingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  warranty_terms: z.string().optional(),
  footer_message: z.string().optional(),
  pix_key: z.string().optional(),
  pix_key_type: z.string().optional(),
  pix_beneficiary: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { settings, isLoading, updateSettings, uploadLogo, removeLogo } = useCompanySettings();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: settings?.name || "Minha Empresa",
      phone: settings?.phone || "",
      email: settings?.email || "",
      document: settings?.document || "",
      address: settings?.address || "",
      city: settings?.city || "",
      state: settings?.state || "",
      zip_code: settings?.zip_code || "",
      warranty_terms: settings?.warranty_terms || "",
      footer_message: settings?.footer_message || "Obrigado pela preferência!",
      pix_key: settings?.pix_key || "",
      pix_key_type: settings?.pix_key_type || "",
      pix_beneficiary: settings?.pix_beneficiary || "",
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettings.mutate({
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      document: data.document || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip_code: data.zip_code || null,
      warranty_terms: data.warranty_terms || null,
      footer_message: data.footer_message || null,
      pix_key: data.pix_key || null,
      pix_key_type: data.pix_key_type || null,
      pix_beneficiary: data.pix_beneficiary || null,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    try {
      await uploadLogo.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    removeLogo.mutate();
  };

  if (isLoading) {
    return (
      <MainLayout title="Configurações" subtitle="Carregando...">
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardContent className="h-96" />
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configurações" subtitle="Personalize as informações da sua empresa">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Logo da Empresa
            </CardTitle>
            <CardDescription>
              O logo será exibido nos documentos impressos. Tamanho recomendado: 200x200px
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg shrink-0">
              <AvatarImage src={settings?.logo_url || undefined} className="object-cover" />
              <AvatarFallback className="rounded-lg text-xl sm:text-2xl bg-muted">
                {settings?.name?.charAt(0) || "E"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Enviando..." : "Enviar Logo"}
              </Button>
              {settings?.logo_url && (
                <Button
                  variant="outline"
                  onClick={handleRemoveLogo}
                  className="text-destructive w-full sm:w-auto"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Estes dados serão usados em documentos impressos e mensagens de WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Minha Assistência Técnica" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ / CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0001-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
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
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-mail
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="contato@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

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
                        <Input placeholder="Rua Exemplo, 123 - Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pix Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-purple-600" />
                  Configuração do Pix
                </CardTitle>
                <CardDescription>
                  Configure sua chave Pix para gerar QR Codes de pagamento nas ordens de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pix_key_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Chave</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PIX_KEY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pix_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave Pix</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={
                              form.watch('pix_key_type') === 'email' ? 'email@exemplo.com' :
                              form.watch('pix_key_type') === 'phone' ? '(11) 99999-9999' :
                              form.watch('pix_key_type') === 'cpf' ? '000.000.000-00' :
                              form.watch('pix_key_type') === 'cnpj' ? '00.000.000/0001-00' :
                              'Sua chave Pix'
                            } 
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
                  name="pix_beneficiary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Beneficiário</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome que aparecerá no Pix (máx. 25 caracteres)" maxLength={25} {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome exibido para quem escanear o QR Code. Se não preenchido, usará o nome da empresa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Textos Personalizados
                </CardTitle>
                <CardDescription>
                  Personalize as mensagens exibidas nos documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="warranty_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termos de Garantia</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A garantia cobre defeitos de serviço, não se aplicando a mau uso, quedas, ou danos causados por terceiros."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Texto exibido na seção de garantia dos documentos impressos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footer_message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Rodapé</FormLabel>
                      <FormControl>
                        <Input placeholder="Obrigado pela preferência!" {...field} />
                      </FormControl>
                      <FormDescription>
                        Mensagem final exibida em documentos e WhatsApp
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSettings.isPending} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Data Import Section */}
        <DataImportCard />

        {/* Change Password Section */}
        <ChangePasswordCard />
      </div>
    </MainLayout>
  );
}