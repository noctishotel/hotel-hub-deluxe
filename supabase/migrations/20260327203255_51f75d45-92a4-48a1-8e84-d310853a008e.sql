
ALTER TABLE public.agenda ADD COLUMN IF NOT EXISTS departamento departamento NULL;

ALTER TABLE public.agenda ALTER COLUMN usuario_id DROP NOT NULL;

DROP POLICY IF EXISTS "Agenda delete own" ON public.agenda;
DROP POLICY IF EXISTS "Agenda insert own" ON public.agenda;
DROP POLICY IF EXISTS "Agenda select own or super_admin" ON public.agenda;
DROP POLICY IF EXISTS "Agenda update own" ON public.agenda;

CREATE POLICY "Agenda select dept or super"
ON public.agenda FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    hotel_id = get_user_hotel_id(auth.uid())
    AND departamento = get_user_departamento(auth.uid())
  )
);

CREATE POLICY "Agenda insert dept"
ON public.agenda FOR INSERT TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    hotel_id = get_user_hotel_id(auth.uid())
    AND departamento = get_user_departamento(auth.uid())
  )
);

CREATE POLICY "Agenda update dept"
ON public.agenda FOR UPDATE TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    hotel_id = get_user_hotel_id(auth.uid())
    AND departamento = get_user_departamento(auth.uid())
  )
);

CREATE POLICY "Agenda delete dept"
ON public.agenda FOR DELETE TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    hotel_id = get_user_hotel_id(auth.uid())
    AND departamento = get_user_departamento(auth.uid())
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agenda_hotel_dept_fecha_idx ON public.agenda (hotel_id, departamento, fecha);
