-- Drop the insecure UPDATE policy that allows any authenticated user to modify offers
DROP POLICY IF EXISTS "Authenticated users can update offers" ON public.offers;

-- Create a secure UPDATE policy that only allows admins to modify offers
CREATE POLICY "Admins can update offers"
ON public.offers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also add INSERT policy for admins only (was missing)
CREATE POLICY "Admins can create offers"
ON public.offers
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy for admins only
CREATE POLICY "Admins can delete offers"
ON public.offers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));