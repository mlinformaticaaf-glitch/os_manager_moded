-- Ajuste específico para ML Informática
-- Requisito: manter nome da empresa, definir numeração inicial em 1696
-- e garantir que a próxima OS seja 1735.

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS os_initial_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS os_next_number INTEGER DEFAULT 1;

DO $$
BEGIN
  UPDATE public.company_settings cs
  SET
    os_initial_number = 1696,
    os_next_number = 1735,
    onboarding_completed = true
  WHERE regexp_replace(
    translate(
      lower(coalesce(cs.name, '')),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ),
    '[^a-z0-9]',
    '',
    'g'
  ) = 'mlinformatica';
END $$;
