
DROP POLICY IF EXISTS "Admins upload signed pdfs" ON storage.objects;
CREATE POLICY "Admins upload signed pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update signed pdfs" ON storage.objects;
CREATE POLICY "Admins update signed pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'admin'));
