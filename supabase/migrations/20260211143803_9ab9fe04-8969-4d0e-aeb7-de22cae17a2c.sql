
ALTER TABLE public.suppliers
ADD COLUMN privileges boolean NOT NULL DEFAULT false,
ADD COLUMN order_advance_days integer NULL;
