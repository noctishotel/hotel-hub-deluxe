DROP POLICY IF EXISTS "Agenda select own" ON public.agenda;

CREATE POLICY "Agenda select own or super_admin"
ON public.agenda FOR SELECT
TO authenticated
USING (
  (usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1))
  OR is_super_admin(auth.uid())
);