-- Drop the recursive policies
DROP POLICY IF EXISTS "Suppliers can view their own record" ON public.supplier_users;
DROP POLICY IF EXISTS "Suppliers can view colleagues in same organization" ON public.supplier_users;

-- Create a single non-recursive policy using the security definer function
CREATE POLICY "Suppliers can view their own supplier users"
ON public.supplier_users
FOR SELECT
USING (
  public.has_role(auth.uid(), 'supplier')
  AND supplier_id = public.get_user_supplier_id(auth.uid())
);