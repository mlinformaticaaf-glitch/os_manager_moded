import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useSaaS } from "@/hooks/useSaaS";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Save, Users, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CompanySettings() {
    const { company, profile, isLoading, createCompany, updateCompany } = useSaaS();
    const [name, setName] = useState("");
    const [cnpj, setCnpj] = useState("");

    useEffect(() => {
        if (company) {
            setName(company.name);
            setCnpj(company.cnpj || "");
        }
    }, [company]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (company) {
            await updateCompany.mutateAsync({ name, cnpj });
        } else {
            await createCompany.mutateAsync({ name, cnpj });
        }
    };

    if (isLoading) {
        return (
            <MainLayout title="Configurações da Empresa" subtitle="Carregando...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500">Ativo</Badge>;
            case 'trialing': return <Badge className="bg-blue-500">Período de Teste</Badge>;
            case 'past_due': return <Badge className="bg-yellow-500">Pagamento Pendente</Badge>;
            case 'canceled': return <Badge className="bg-red-500">Cancelado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <MainLayout title="Configurações da Empresa" subtitle="Gerencie os dados da sua organização e assinatura">
            <div className="space-y-6 max-w-4xl">
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Dados da Organização
                            </CardTitle>
                            <CardDescription>
                                Informações principais da sua empresa no sistema
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nome da Empresa</Label>
                                    <Input
                                        id="companyName"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Minha Empresa LTDA"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyCnpj">CNPJ</Label>
                                    <Input
                                        id="companyCnpj"
                                        value={cnpj}
                                        onChange={(e) => setCnpj(e.target.value)}
                                        placeholder="00.000.000/0001-00"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={updateCompany.isPending || createCompany.isPending}
                                    className="w-full sm:w-auto"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {company ? "Atualizar Dados" : "Criar Empresa"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                Sua Conta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase">Nível de Acesso</Label>
                                <p className="font-medium capitalize">{profile?.role || "Usuário"}</p>
                            </div>
                            <Separator />
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase">ID da Empresa</Label>
                                <p className="text-xs font-mono break-all text-muted-foreground">
                                    {company?.id || "Ainda não vinculada"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>



                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Colaboradores
                        </CardTitle>
                        <CardDescription>
                            Convide outros membros da sua equipe (Em desenvolvimento)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Funcionalidade disponível em breve para assinantes do Plano Silver.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
