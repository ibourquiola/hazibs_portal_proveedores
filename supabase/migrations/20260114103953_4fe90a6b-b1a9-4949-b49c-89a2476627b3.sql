-- Drop existing SELECT policies for supplier_users
DROP POLICY IF EXISTS "Supplier users can view their own record" ON public.supplier_users;
DROP POLICY IF EXISTS "Supplier users can view colleagues" ON public.supplier_users;

-- Create stricter policies that check both role and supplier membership
CREATE POLICY "Suppliers can view their own record"
ON public.supplier_users
FOR SELECT
USING (
  user_id = auth.uid() 
  AND public.has_role(auth.uid(), 'supplier')
);

CREATE POLICY "Suppliers can view colleagues in same organization"
ON public.supplier_users
FOR SELECT
USING (
  public.has_role(auth.uid(), 'supplier')
  AND EXISTS (
    SELECT 1 FROM public.supplier_users su
    WHERE su.user_id = auth.uid()
    AND su.supplier_id = supplier_users.supplier_id
  )
);