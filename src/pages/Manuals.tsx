
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen, Image as ImageIcon, Trash2, Loader2, Play, ChevronRight, ChevronLeft, CheckCircle2, Search } from 'lucide-react';
import { useManuals, useManualSteps } from '@/hooks/useManuals';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { CreateManualStepInput, Manual } from '@/types/manual';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Added cn import
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

function ManualViewModal({ manual, open, onOpenChange }: { manual: Manual | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    useMobileBackButton(open, () => onOpenChange(false));
    const { data: steps = [], isLoading } = useManualSteps(manual?.id ?? null);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);

    if (!manual) return null;

    const currentStep = steps[currentStepIdx];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border">
                <DialogHeader className="p-6 border-b bg-muted/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl">{manual.title}</DialogTitle>
                            <DialogDescription>{manual.category || 'Procedimento Operacional'}</DialogDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                                Passo {steps.length > 0 ? currentStepIdx + 1 : 0} de {steps.length}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.print()}>Exportar PDF</Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : steps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            {/* Lado Esquerdo: Instruções */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                                            {currentStepIdx + 1}
                                        </span>
                                        {currentStep?.title || 'Instruções'}
                                    </h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                                        {currentStep?.description}
                                    </p>
                                </div>

                                <div className="pt-10">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Progresso</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {steps.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "w-3 h-3 rounded-full transition-colors",
                                                    idx === currentStepIdx ? "bg-primary scale-125" :
                                                        idx < currentStepIdx ? "bg-primary/40" : "bg-muted"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Lado Direito: Imagem */}
                            <div className="bg-muted/30 rounded-xl border flex items-center justify-center overflow-hidden min-h-[300px]">
                                {currentStep?.image_url ? (
                                    <img
                                        src={currentStep.image_url}
                                        alt={currentStep.title || 'Passo'}
                                        className="w-full h-full object-contain shadow-2xl"
                                    />
                                ) : (
                                    <div className="text-center p-10 text-muted-foreground">
                                        <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                        <p>Nenhuma imagem para este passo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                            <p>Este manual não possui passos cadastrados.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentStepIdx === 0}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    {currentStepIdx === steps.length - 1 ? (
                        <Button onClick={() => onOpenChange(false)} className="gap-2 bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-4 w-4" /> Concluir Procedimento
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1))}
                            disabled={steps.length === 0}
                            className="gap-2"
                        >
                            Próximo <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Manuals() {
    const { manuals, isLoading, createManual, deleteManual } = useManuals();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewingManual, setViewingManual] = useState<Manual | null>(null);

    useMobileBackButton(isDialogOpen, () => setIsDialogOpen(false));

    // States for new manual
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [steps, setSteps] = useState<Partial<CreateManualStepInput>[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const categories = Array.from(new Set(manuals.map(m => m.category).filter(Boolean)));

    const filteredManuals = manuals.filter(manual => {
        const matchesSearch =
            manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (manual.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || manual.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const addStep = () => {
        setSteps([...steps, { title: '', description: '', image_url: '' }]);
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const updateStep = (index: number, field: keyof CreateManualStepInput, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const handleImageUpload = async (index: number, file: File) => {
        try {
            setIsUploading(true);
            const url = await uploadToCloudinary(file);
            updateStep(index, 'image_url', url);
            toast({
                title: "Sucesso",
                description: "Imagem enviada para o Cloudinary!",
            });
        } catch (error: any) {
            toast({
                title: "Erro no upload",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title) {
            toast({ title: "Título obrigatório", variant: "destructive" });
            return;
        }

        createManual.mutate({
            title,
            description,
            category,
            steps: steps as CreateManualStepInput[]
        }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                resetForm();
            }
        });
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('');
        setSteps([]);
    };

    return (
        <MainLayout title="Manuais Operacionais" subtitle="Procedimentos Técnicos e Manuais da Empresa">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold">Meus Manuais</h2>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar manuais..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 w-full"
                            />
                        </div>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10">
                                <SelectValue placeholder="Todas as categorias" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat as string}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 h-10 w-full sm:w-auto shrink-0">
                                    <Plus className="h-4 w-4" />
                                    Novo Manual
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Manual Operacional</DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Título do Manual</Label>
                                            <CapitalizedInput
                                                placeholder="Ex: Troca de Tela iPhone 11"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Categoria</Label>
                                            <CapitalizedInput
                                                placeholder="Ex: Smartphones, Notebooks"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Descrição Geral</Label>
                                        <CapitalizedTextarea
                                            placeholder="Breve resumo do procedimento..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-medium">Passos do Procedimento</h3>
                                            <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-2">
                                                <Plus className="h-3 w-3" /> Adicionar Passo
                                            </Button>
                                        </div>

                                        <div className="space-y-6">
                                            {steps.map((step, index) => (
                                                <div key={index} className="p-4 border rounded-lg bg-muted/30 relative">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 text-destructive"
                                                        onClick={() => removeStep(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>

                                                    <div className="flex gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                                                            {index + 1}
                                                        </div>

                                                        <div className="flex-1 space-y-4">
                                                            <CapitalizedInput
                                                                placeholder="Título do passo..."
                                                                value={step.title || ''}
                                                                onChange={(e) => updateStep(index, 'title', e.target.value)}
                                                            />
                                                            <CapitalizedTextarea
                                                                placeholder="Instruções detalhadas..."
                                                                value={step.description || ''}
                                                                onChange={(e) => updateStep(index, 'description', e.target.value)}
                                                            />

                                                            <div className="space-y-2">
                                                                <Label className="flex items-center gap-2">
                                                                    <ImageIcon className="h-4 w-4" /> Foto do Passo
                                                                </Label>
                                                                <div className="flex items-start gap-4">
                                                                    <Input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleImageUpload(index, file);
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    />
                                                                    {step.image_url && (
                                                                        <div className="w-24 h-24 rounded border overflow-hidden bg-white">
                                                                            <img src={step.image_url} alt="Passo" className="w-full h-full object-cover" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6">
                                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleSubmit} disabled={createManual.isPending || isUploading}>
                                            {createManual.isPending ? "Salvando..." : "Salvar Manual"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredManuals.map((manual) => (
                            <Card key={manual.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        {manual.category && (
                                            <span className="text-[10px] bg-muted px-2 py-1 rounded-full uppercase font-bold text-muted-foreground tracking-wider">
                                                {manual.category}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="mt-4">{manual.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{manual.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto pt-4 border-t flex justify-between gap-2">
                                    <Button variant="ghost" className="text-destructive h-8 px-2" onClick={() => deleteManual.mutate(manual.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setViewingManual(manual)}>
                                        <Play className="h-4 w-4" /> Visualizar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredManuals.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-muted">
                                <p className="text-muted-foreground">
                                    {searchTerm || categoryFilter !== 'all'
                                        ? "Nenhum manual encontrado para esta busca."
                                        : "Nenhum manual cadastrado ainda."}
                                </p>
                                {searchTerm === '' && categoryFilter === 'all' && (
                                    <Button variant="link" onClick={() => setIsDialogOpen(true)} className="mt-2 text-primary">
                                        Clique aqui para criar o primeiro
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ManualViewModal
                manual={viewingManual}
                open={!!viewingManual}
                onOpenChange={(open) => !open && setViewingManual(null)}
            />
        </MainLayout>
    );
}
