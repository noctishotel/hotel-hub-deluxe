
CREATE TABLE public.notas_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hoteles(id),
  departamento public.departamento NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  nota text NOT NULL DEFAULT '',
  usuario_id uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, departamento, fecha, usuario_id)
);

ALTER TABLE public.notas_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notas checklist select" ON public.notas_checklist
  FOR SELECT TO authenticated
  USING (hotel_id = get_user_hotel_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Notas checklist insert" ON public.notas_checklist
  FOR INSERT TO authenticated
  WITH CHECK (hotel_id = get_user_hotel_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Notas checklist update" ON public.notas_checklist
  FOR UPDATE TO authenticated
  USING (
    (usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1))
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Notas checklist delete" ON public.notas_checklist
  FOR DELETE TO authenticated
  USING (
    (usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1))
    OR is_super_admin(auth.uid())
  );
