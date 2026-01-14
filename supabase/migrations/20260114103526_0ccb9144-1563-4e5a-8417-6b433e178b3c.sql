-- Allow admins to view all offer_applications
CREATE POLICY "Admins can view all applications"
ON public.offer_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all offer_applications
CREATE POLICY "Admins can update all applications"
ON public.offer_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));