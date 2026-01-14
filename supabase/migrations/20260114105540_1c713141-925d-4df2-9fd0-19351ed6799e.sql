-- Create order_confirmations table to track each confirmation event
CREATE TABLE public.order_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_application_id UUID NOT NULL REFERENCES public.offer_applications(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  offer_id UUID,
  units INTEGER NOT NULL,
  term TEXT NOT NULL,
  price_euros NUMERIC NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_confirmations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all confirmations
CREATE POLICY "Admins can manage order confirmations"
ON public.order_confirmations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Suppliers can view their own confirmations
CREATE POLICY "Suppliers can view their own confirmations"
ON public.order_confirmations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'supplier')
  AND supplier_id = public.get_user_supplier_id(auth.uid())
);

-- Create index for faster queries
CREATE INDEX idx_order_confirmations_supplier ON public.order_confirmations(supplier_id);
CREATE INDEX idx_order_confirmations_offer_application ON public.order_confirmations(offer_application_id);