-- Create service orders table
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  order_number SERIAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'completed', 'delivered', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  equipment TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  accessories TEXT,
  reported_issue TEXT NOT NULL,
  diagnosis TEXT,
  solution TEXT,
  internal_notes TEXT,
  warranty_until DATE,
  estimated_completion DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  total_services DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_products DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service order items table (for products and services)
CREATE TABLE public.service_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for service_orders
CREATE POLICY "Users can view their own service orders" 
ON public.service_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service orders" 
ON public.service_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service orders" 
ON public.service_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service orders" 
ON public.service_orders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for service_order_items (based on parent order ownership)
CREATE POLICY "Users can view items of their orders" 
ON public.service_order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = service_order_items.service_order_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create items for their orders" 
ON public.service_order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = service_order_items.service_order_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items of their orders" 
ON public.service_order_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = service_order_items.service_order_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items of their orders" 
ON public.service_order_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = service_order_items.service_order_id 
    AND user_id = auth.uid()
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_service_orders_user_id ON public.service_orders(user_id);
CREATE INDEX idx_service_orders_client_id ON public.service_orders(client_id);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);
CREATE INDEX idx_service_orders_order_number ON public.service_orders(order_number);
CREATE INDEX idx_service_order_items_order_id ON public.service_order_items(service_order_id);