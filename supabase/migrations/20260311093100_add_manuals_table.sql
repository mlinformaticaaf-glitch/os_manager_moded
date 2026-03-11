
-- Tabela de Manuais Operacionais
CREATE TABLE IF NOT EXISTS manuals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela de Passos do Manual
CREATE TABLE IF NOT EXISTS manual_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manual_id UUID REFERENCES manuals(id) ON DELETE CASCADE NOT NULL,
    step_order INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT, -- URL do Cloudinary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_steps ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Qualquer usuário autenticado pode ler manuais" ON manuals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Qualquer usuário autenticado pode ler passos" ON manual_steps
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas administradores podem inserir/editar manuais" ON manuals
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas administradores podem inserir/editar passos" ON manual_steps
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manuals_updated_at BEFORE UPDATE ON manuals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_manual_steps_updated_at BEFORE UPDATE ON manual_steps FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();