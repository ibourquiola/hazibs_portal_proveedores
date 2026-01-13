-- Make order_number have a default so TypeScript doesn't require it on insert
-- The trigger will still generate the actual value
ALTER TABLE public.offer_applications
ALTER COLUMN order_number SET DEFAULT '';