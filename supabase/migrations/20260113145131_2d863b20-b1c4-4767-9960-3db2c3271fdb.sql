-- Add status column to offer_applications for order verification workflow
-- Status: 'pendiente' (default when created), 'confirmado' (after verification)
CREATE TYPE public.order_status AS ENUM ('pendiente', 'confirmado');

ALTER TABLE public.offer_applications
ADD COLUMN status public.order_status NOT NULL DEFAULT 'pendiente';

-- Add verified_at timestamp to track when verification occurred
ALTER TABLE public.offer_applications
ADD COLUMN verified_at timestamp with time zone DEFAULT NULL;

-- Create index for faster status queries
CREATE INDEX idx_offer_applications_status ON public.offer_applications(status);
CREATE INDEX idx_offer_applications_user_status ON public.offer_applications(user_id, status);