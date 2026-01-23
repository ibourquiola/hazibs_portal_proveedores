-- Table for offer lines (materials in each offer)
CREATE TABLE public.offer_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  material_code VARCHAR NOT NULL,
  material_description TEXT NOT NULL,
  requested_units INTEGER NOT NULL,
  deadline DATE,
  reference_price NUMERIC,
  confirmed_units INTEGER,
  confirmed_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for order lines (items in each order)
CREATE TABLE public.order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_application_id UUID NOT NULL REFERENCES public.offer_applications(id) ON DELETE CASCADE,
  article_code VARCHAR NOT NULL,
  description TEXT NOT NULL,
  requested_units INTEGER NOT NULL,
  requested_term DATE,
  requested_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for order line confirmations (partial confirmations by supplier)
CREATE TABLE public.order_line_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_line_id UUID NOT NULL REFERENCES public.order_lines(id) ON DELETE CASCADE,
  offer_application_id UUID NOT NULL REFERENCES public.offer_applications(id) ON DELETE CASCADE,
  article_code VARCHAR NOT NULL,
  confirmed_units INTEGER NOT NULL,
  confirmed_term DATE NOT NULL,
  confirmed_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_line_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policies for offer_lines
CREATE POLICY "Authenticated users can view offer lines"
ON public.offer_lines
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage offer lines"
ON public.offer_lines
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Suppliers can update offer lines for their applications"
ON public.offer_lines
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.offer_applications oa
    WHERE oa.offer_id = offer_lines.offer_id
    AND oa.user_id = auth.uid()
  )
);

-- RLS policies for order_lines
CREATE POLICY "Users can view their own order lines"
ON public.order_lines
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offer_applications oa
    WHERE oa.id = order_lines.offer_application_id
    AND oa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order lines"
ON public.order_lines
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage order lines"
ON public.order_lines
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for order_line_confirmations
CREATE POLICY "Users can view their own confirmations"
ON public.order_line_confirmations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offer_applications oa
    WHERE oa.id = order_line_confirmations.offer_application_id
    AND oa.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own confirmations"
ON public.order_line_confirmations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.offer_applications oa
    WHERE oa.id = order_line_confirmations.offer_application_id
    AND oa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all confirmations"
ON public.order_line_confirmations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all confirmations"
ON public.order_line_confirmations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_offer_lines_updated_at
BEFORE UPDATE ON public.offer_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();