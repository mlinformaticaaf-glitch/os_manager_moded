-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code INTEGER,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own equipment"
ON public.equipment
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own equipment"
ON public.equipment
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
ON public.equipment
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
ON public.equipment
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to get next equipment code
CREATE OR REPLACE FUNCTION public.get_next_equipment_code(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_code integer;
BEGIN
  SELECT COALESCE(MAX(code), 0) + 1 INTO next_code
  FROM equipment
  WHERE user_id = p_user_id;
  
  RETURN next_code;
END;
$$;

-- Create trigger to auto-set code
CREATE OR REPLACE FUNCTION public.set_equipment_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := public.get_next_equipment_code(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_equipment_code_trigger
BEFORE INSERT ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.set_equipment_code();

-- Create trigger for updated_at
CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();