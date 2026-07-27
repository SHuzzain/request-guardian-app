ALTER TABLE public.requests
  ADD CONSTRAINT requests_requester_id_profiles_fkey
  FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';