-- Create boletos table for bill management
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  issuer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  barcode TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own boletos" 
ON public.boletos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boletos" 
ON public.boletos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boletos" 
ON public.boletos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boletos" 
ON public.boletos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_boletos_updated_at
BEFORE UPDATE ON public.boletos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create boleto_payments table for payment records
CREATE TABLE public.boleto_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boleto_id UUID NOT NULL REFERENCES public.boletos(id) ON DELETE CASCADE,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_paid NUMERIC NOT NULL,
  receipt_url TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.boleto_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments (based on boleto ownership)
CREATE POLICY "Users can view payments of their boletos" 
ON public.boleto_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.boletos 
  WHERE boletos.id = boleto_payments.boleto_id 
  AND boletos.user_id = auth.uid()
));

CREATE POLICY "Users can create payments for their boletos" 
ON public.boleto_payments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.boletos 
  WHERE boletos.id = boleto_payments.boleto_id 
  AND boletos.user_id = auth.uid()
));

CREATE POLICY "Users can update payments of their boletos" 
ON public.boleto_payments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.boletos 
  WHERE boletos.id = boleto_payments.boleto_id 
  AND boletos.user_id = auth.uid()
));

CREATE POLICY "Users can delete payments of their boletos" 
ON public.boleto_payments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.boletos 
  WHERE boletos.id = boleto_payments.boleto_id 
  AND boletos.user_id = auth.uid()
));

-- Create storage buckets for boleto PDFs and payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('boletos', 'boletos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

-- Storage policies for boletos bucket
CREATE POLICY "Users can upload their own boleto files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'boletos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own boleto files"
ON storage.objects FOR SELECT
USING (bucket_id = 'boletos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own boleto files"
ON storage.objects FOR DELETE
USING (bucket_id = 'boletos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for payment-receipts bucket
CREATE POLICY "Users can upload their own receipt files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipt files"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipt files"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);