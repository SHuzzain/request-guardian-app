
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS signed_pdf_path text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS signature_meta jsonb;

-- Allow request owners to update their own request when status is needs_changes (resubmit flow).
DROP POLICY IF EXISTS "requests_owner_update_needs_changes" ON public.requests;
CREATE POLICY "requests_owner_update_needs_changes"
ON public.requests FOR UPDATE
TO authenticated
USING (requester_id = auth.uid() AND status = 'needs_changes'::request_status)
WITH CHECK (requester_id = auth.uid() AND status IN ('needs_changes'::request_status, 'pending'::request_status));

-- Allow owners to delete their attachments during resubmit (in addition to any existing policies).
DROP POLICY IF EXISTS "attachments_owner_delete_needs_changes" ON public.request_attachments;
CREATE POLICY "attachments_owner_delete_needs_changes"
ON public.request_attachments FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = request_attachments.request_id
      AND r.requester_id = auth.uid()
      AND r.status IN ('needs_changes'::request_status, 'pending'::request_status)
  )
);
