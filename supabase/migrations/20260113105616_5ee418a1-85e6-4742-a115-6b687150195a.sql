-- Allow users to update their own applications
CREATE POLICY "Users can update their own applications"
ON public.offer_applications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);