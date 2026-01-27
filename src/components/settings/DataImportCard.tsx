import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type ImportType = "clients" | "equipment" | "products" | "services";

interface ImportResult {
  success: number;
  errors: string[];
}

const IMPORT_TYPES: { value: ImportType; label: string; description: string }[] = [
  { value: "clients", label: "Clientes", description: "nome, email, telefone, documento, endereco, cidade, estado, cep, observacoes" },
  { value: "equipment", label: "Equipamentos", description: "descricao, ativo (sim/nao)" },
  { value: "products", label: "Produtos", description: "nome, descricao, categoria, preco_custo, preco_venda, estoque, estoque_minimo, unidade" },
  { value: "services", label: "Serviços", description: "nome, descricao, categoria, preco_custo, preco_venda, tempo_estimado" },
];

export function DataImportCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importType, setImportType] = useState<ImportType>("clients");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header - handle both comma and semicolon separators
    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => 
      h.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, "_")
    );

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator);
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index].trim();
        });
        rows.push(row);
      }
    }
    return rows;
  };

  const parseCSVLine = (line: string, separator: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const mapClientData = (row: Record<string, string>) => ({
    user_id: user!.id,
    name: row.nome || row.name || '',
    email: row.email || null,
    phone: row.telefone || row.phone || null,
    document: row.documento || row.document || row.cpf || row.cnpj || null,
    address: row.endereco || row.address || null,
    city: row.cidade || row.city || null,
    state: row.estado || row.state || row.uf || null,
    zip_code: row.cep || row.zip_code || null,
    notes: row.observacoes || row.notes || row.obs || null,
  });

  const mapEquipmentData = (row: Record<string, string>) => ({
    user_id: user!.id,
    description: row.descricao || row.description || row.nome || row.name || '',
    active: !row.ativo || row.ativo.toLowerCase() === 'sim' || row.ativo.toLowerCase() === 'true' || row.ativo === '1',
  });

  const mapProductData = (row: Record<string, string>) => ({
    user_id: user!.id,
    name: row.nome || row.name || '',
    description: row.descricao || row.description || null,
    category: row.categoria || row.category || null,
    cost_price: parseFloat(row.preco_custo || row.cost_price || row.custo || '0') || 0,
    sale_price: parseFloat(row.preco_venda || row.sale_price || row.preco || row.venda || '0') || 0,
    stock_quantity: parseFloat(row.estoque || row.stock || row.quantidade || '0') || 0,
    min_stock: parseFloat(row.estoque_minimo || row.min_stock || '0') || 0,
    unit: row.unidade || row.unit || 'un',
    active: true,
  });

  const mapServiceData = (row: Record<string, string>) => ({
    user_id: user!.id,
    name: row.nome || row.name || '',
    description: row.descricao || row.description || null,
    category: row.categoria || row.category || null,
    cost_price: parseFloat(row.preco_custo || row.cost_price || row.custo || '0') || 0,
    sale_price: parseFloat(row.preco_venda || row.sale_price || row.preco || row.venda || '0') || 0,
    estimated_time: row.tempo_estimado || row.estimated_time || row.tempo || null,
    active: true,
  });

  const importData = async (rows: Record<string, string>[]) => {
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        let error: { message: string } | null = null;

        if (importType === 'clients') {
          const data = mapClientData(rows[i]);
          if (!data.name) {
            errors.push(`Linha ${i + 2}: Nome é obrigatório`);
            continue;
          }
          const result = await supabase.from('clients').insert(data);
          error = result.error;
        } else if (importType === 'equipment') {
          const data = mapEquipmentData(rows[i]);
          if (!data.description) {
            errors.push(`Linha ${i + 2}: Descrição é obrigatória`);
            continue;
          }
          const result = await supabase.from('equipment').insert(data);
          error = result.error;
        } else if (importType === 'products') {
          const data = mapProductData(rows[i]);
          if (!data.name) {
            errors.push(`Linha ${i + 2}: Nome é obrigatório`);
            continue;
          }
          const result = await supabase.from('products').insert(data);
          error = result.error;
        } else if (importType === 'services') {
          const data = mapServiceData(rows[i]);
          if (!data.name) {
            errors.push(`Linha ${i + 2}: Nome é obrigatório`);
            continue;
          }
          const result = await supabase.from('services').insert(data);
          error = result.error;
        }

        if (error) {
          errors.push(`Linha ${i + 2}: ${error.message}`);
        } else {
          success++;
        }
      } catch (err) {
        errors.push(`Linha ${i + 2}: Erro ao processar dados`);
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    return { success, errors };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo CSV não contém dados válidos.",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const importResult = await importData(rows);
      setResult(importResult);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [importType] });

      toast({
        title: "Importação concluída",
        description: `${importResult.success} registros importados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const templates: Record<ImportType, string> = {
      clients: "nome;email;telefone;documento;endereco;cidade;estado;cep;observacoes\nJoão Silva;joao@email.com;11999999999;123.456.789-00;Rua Exemplo, 123;São Paulo;SP;01234-567;Cliente VIP",
      equipment: "descricao;ativo\nNotebook Dell;sim\nImpressora HP;sim",
      products: "nome;descricao;categoria;preco_custo;preco_venda;estoque;estoque_minimo;unidade\nPeça X;Descrição da peça;Peças;10.00;25.00;100;10;un",
      services: "nome;descricao;categoria;preco_custo;preco_venda;tempo_estimado\nManutenção Básica;Limpeza e verificação;Manutenção;20.00;80.00;1 hora",
    };

    const content = templates[importType];
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modelo_${importType}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedType = IMPORT_TYPES.find(t => t.value === importType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Dados (CSV)
        </CardTitle>
        <CardDescription>
          Importe dados em massa a partir de arquivos CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de dados</label>
          <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMPORT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedType && (
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <strong>Colunas esperadas:</strong> {selectedType.description}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isImporting}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importando..." : "Selecionar Arquivo CSV"}
          </Button>
          <Button
            variant="ghost"
            onClick={downloadTemplate}
            disabled={isImporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Modelo
          </Button>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">{progress}% concluído</p>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">{result.success} registros importados</span>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{result.errors.length} erros encontrados</span>
                </div>
                <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-muted p-2 rounded">
                  {result.errors.slice(0, 10).map((error, i) => (
                    <div key={i}>{error}</div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="mt-1 font-medium">...e mais {result.errors.length - 10} erros</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
