-- Fix search_path for get_user_supplier_id function
CREATE OR REPLACE FUNCTION public.get_user_supplier_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT supplier_id
  FROM public.supplier_users
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Fix generate_order_number function search_path
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  current_year INTEGER;
  next_seq INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 9 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM public.offer_applications
  WHERE order_number LIKE 'PE-' || current_year || '-%';
  
  NEW.order_number := 'PE-' || current_year || '-' || LPAD(next_seq::TEXT, 3, '0');
  
  RETURN NEW;
END;
$function$;