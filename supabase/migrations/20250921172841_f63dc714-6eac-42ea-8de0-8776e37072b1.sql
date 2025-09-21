-- Create storage buckets for invoices and reports
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('invoices', 'invoices', false),
  ('reports', 'reports', false);

-- Create storage policies for invoices (admin and users can access their own)
CREATE POLICY "Users can view their own invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "System can upload invoices" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices');

-- Create storage policies for reports (admin only)
CREATE POLICY "Admins can manage reports" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'reports' AND EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Create invoices table to track invoice metadata
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create invoice policies
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM trades t WHERE t.id = trade_id AND t.user_id = auth.uid()
));

CREATE POLICY "Admins can view all invoices" 
ON public.invoices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Chapter leaders can view chapter invoices" 
ON public.invoices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM trades t 
  JOIN profiles p ON t.user_id = p.id 
  JOIN profiles cl ON cl.id = auth.uid() 
  WHERE t.id = trade_id 
  AND p.chapter_id = cl.chapter_id 
  AND cl.role = 'chapter_leader'
));

-- Create payments table to track MPESA transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  mpesa_checkout_request_id TEXT,
  mpesa_receipt_number TEXT,
  phone_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  response_description TEXT,
  result_code INTEGER,
  result_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create payment policies
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM invoices i 
  JOIN trades t ON i.trade_id = t.id 
  WHERE i.id = invoice_id AND t.user_id = auth.uid()
));

CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_invoices_trade_id ON invoices(trade_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_mpesa_receipt ON payments(mpesa_receipt_number);