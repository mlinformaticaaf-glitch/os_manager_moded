
CREATE TABLE public.status_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status_key TEXT NOT NULL,
  custom_label TEXT NOT NULL,
  custom_short_label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, status_key)
);

ALTER TABLE public.status_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own status settings" ON public.status_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own status settings" ON public.status_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own status settings" ON public.status_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own status settings" ON public.status_settings FOR DELETE USING (auth.uid() = user_id);
