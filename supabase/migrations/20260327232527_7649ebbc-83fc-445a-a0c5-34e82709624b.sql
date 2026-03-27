-- Restrict checklist template management to super_admin only
DROP POLICY IF EXISTS "Tareas delete by admin/super" ON public.tareas;
DROP POLICY IF EXISTS "Tareas insert by admin/super" ON public.tareas;
DROP POLICY IF EXISTS "Tareas update by admin/super" ON public.tareas;

CREATE POLICY "Tareas delete by super_admin"
ON public.tareas
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Tareas insert by super_admin"
ON public.tareas
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Tareas update by super_admin"
ON public.tareas
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Categorias delete by admin/super" ON public.categorias_checklist;
DROP POLICY IF EXISTS "Categorias insert by admin/super" ON public.categorias_checklist;
DROP POLICY IF EXISTS "Categorias update by admin/super" ON public.categorias_checklist;

CREATE POLICY "Categorias delete by super_admin"
ON public.categorias_checklist
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Categorias insert by super_admin"
ON public.categorias_checklist
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Categorias update by super_admin"
ON public.categorias_checklist
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuarios insert by admin/super" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios update by admin/super" ON public.usuarios;

CREATE POLICY "Usuarios insert by super_admin"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Usuarios update by super_admin"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));