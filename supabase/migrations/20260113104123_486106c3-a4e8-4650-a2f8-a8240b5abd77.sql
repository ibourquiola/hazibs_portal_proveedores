-- Add deadline column to offers table
ALTER TABLE public.offers ADD COLUMN deadline DATE;

-- Create offer_applications table to store supplier applications
CREATE TABLE public.offer_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  units INTEGER NOT NULL CHECK (units > 0),
  term TEXT NOT NULL,
  price_euros NUMERIC(10,2) NOT NULL CHECK (price_euros > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.offer_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create their own applications"
ON public.offer_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_offer_applications_offer_id ON public.offer_applications(offer_id);
CREATE INDEX idx_offer_applications_user_id ON public.offer_applications(user_id);