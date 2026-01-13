-- Add order_number column with auto-generated format PE-YYYY-NNN
ALTER TABLE public.offer_applications
ADD COLUMN order_number VARCHAR(20);

-- Create a function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  next_seq INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Get the next sequence number for the current year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 9 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM public.offer_applications
  WHERE order_number LIKE 'PE-' || current_year || '-%';
  
  NEW.order_number := 'PE-' || current_year || '-' || LPAD(next_seq::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order_number on insert
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.offer_applications
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION public.generate_order_number();

-- Update existing records with order numbers
DO $$
DECLARE
  rec RECORD;
  current_year INTEGER;
  seq_num INTEGER := 0;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  FOR rec IN 
    SELECT id FROM public.offer_applications 
    WHERE order_number IS NULL 
    ORDER BY created_at
  LOOP
    seq_num := seq_num + 1;
    UPDATE public.offer_applications 
    SET order_number = 'PE-' || current_year || '-' || LPAD(seq_num::TEXT, 3, '0')
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Make order_number NOT NULL after populating existing records
ALTER TABLE public.offer_applications
ALTER COLUMN order_number SET NOT NULL;

-- Add unique constraint
ALTER TABLE public.offer_applications
ADD CONSTRAINT offer_applications_order_number_unique UNIQUE (order_number);

-- Make offer_id nullable (orders can exist without an offer)
ALTER TABLE public.offer_applications
ALTER COLUMN offer_id DROP NOT NULL;