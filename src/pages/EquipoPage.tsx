import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, UserCog, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UsuarioItem {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  departamento: string;
  activo: boolean;
  auth_id: string | null;
}

const ALL_DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

const ROLES = [
  { value: "empleado", label: "Empleado" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export default function EquipoPage() {
  const { usuario, hotelId } = useAuth();
  const isSuperAdmin = usuario?.rol === "super_admin";
  const DEPARTAMENTOS = ALL_DEPARTAMENTOS.filter(d => d.value !== "administracion" || isSuperAdmin);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editUser, setEditUser] = useState<UsuarioItem | null>(null);

  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRol, setFormRol] = useState("empleado");
  const [formDept, setFormDept] = useState("recepcion");
  const [saving, setSaving] = useState(false);

  const isAdmin = usuario?.rol === "admin" || isSuperAdmin;

  useEffect(() => {
    if (hotelId) loadUsers();
  }, [hotelId]);

  if (usuario && !isSuperAdmin) {
    return <Navigate to="/panel" replace />;
  }

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("hotel_id", hotelId!)
        .order("nombre");
      setUsuarios(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: UsuarioItem) => {
    setEditUser(u);
    setFormNombre(u.nombre);
    setFormEmail(u.email);
    setFormRol(u.rol);
    setFormDept(u.departamento);
    setFormPassword("");
  };

  const saveUser = async () => {
    if (!formNombre.trim() || !formEmail.trim()) return;
    setSaving(true);
    try {
      if (editUser) {
        const update: any = {
          nombre: formNombre,
          email: formEmail,
          rol: formRol,
          departamento: formDept,
        };
        await supabase.from("usuarios").update(update).eq("id", editUser.id);
        toast.success("Usuario actualizado");
      } else {
        if (!formPassword || formPassword.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres");
          setSaving(false);
          return;
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formEmail,
          password: formPassword,
        });
        if (authError) throw authError;

        await supabase.from("usuarios").insert({
          nombre: formNombre,
          email: formEmail,
          rol: formRol as any,
          departamento: formDept as any,
          hotel_id: hotelId!,
          auth_id: authData.user?.id ?? null,
        });
        toast.success("Nuevo usuario creado");
      }
      setShowNew(false);
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (u: UsuarioItem) => {
    try {
      // Only super_admin can permanently delete
      if (isSuperAdmin) {
        await supabase.from("usuarios").update({ activo: false }).eq("id", u.id);
        toast.success("Usuario eliminado definitivamente");
      } else if (isAdmin) {
        await supabase.from("usuarios").update({ activo: false }).eq("id", u.id);
        toast.success("Usuario eliminado del equipo");
      }
      loadUsers();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  const userForm = (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[13px]">Nombre completo</Label>
        <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label className="text-[13px]">Correo electrónico</Label>
        <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="correo@hotel.com" className="h-10" />
      </div>
      {!editUser && (
        <div className="space-y-1">
          <Label className="text-[13px]">Contraseña</Label>
          <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Mín. 6 caracteres" className="h-10" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[13px]">Departamento</Label>
          <Select value={formDept} onValueChange={setFormDept}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[13px]">Rol</Label>
          <Select value={formRol} onValueChange={setFormRol}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(isSuperAdmin ? ROLES : ROLES.filter(r => r.value !== "super_admin")).map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={saveUser} className="w-full flex-1 h-10" disabled={saving}>
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );

  // Filter: admins only see active users, super_admin sees all
  const visibleUsers = isSuperAdmin ? usuarios : usuarios.filter(u => u.activo);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Equipo</h1>
        {isAdmin && (
          <Dialog open={showNew} onOpenChange={(open) => { setShowNew(open); if (!open) { setFormNombre(""); setFormEmail(""); setFormPassword(""); setFormRol("empleado"); setFormDept("recepcion"); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo usuario</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-border/50">
              <DialogHeader><DialogTitle className="text-lg font-semibold">Nuevo usuario</DialogTitle></DialogHeader>
              {userForm}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader><DialogTitle className="text-lg font-semibold tracking-tight">Editar usuario</DialogTitle></DialogHeader>
          {userForm}
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {visibleUsers.map((u) => (
          <Card key={u.id} className={`bg-card/60 backdrop-blur-sm border-border/50 ${!u.activo ? "opacity-50" : ""}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.nombre}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {DEPARTAMENTOS.find((d) => d.value === u.departamento)?.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{u.rol}</Badge>
                  {!u.activo && <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>}
                </div>
              </div>
              {isAdmin && u.id !== usuario?.id && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)}>
                    <UserCog className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar a {u.nombre}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isSuperAdmin ? "Se desactivará permanentemente este usuario." : "Se eliminará del equipo."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(u)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
