import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Estado = "abierta" | "en_proceso" | "resuelta" | "cerrada";
type Prioridad = "baja" | "media" | "alta" | "urgente";

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: Estado;
  prioridad: Prioridad;
  departamento: string;
  creado_en: string;
  creado_por: string | null;
  asignado_a: string | null;
  hotel_id: string;
  foto_url: string | null;
}

interface Usuario {
  id: string;
  nombre: string;
  departamento: string;
}

const DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

const ESTADOS: { value: Estado; label: string; color: string }[] = [
  { value: "abierta", label: "Abierta", color: "hsl(0, 72%, 51%)" },
  { value: "en_proceso", label: "En proceso", color: "hsl(38, 92%, 50%)" },
  { value: "resuelta", label: "Resuelta", color: "hsl(142, 52%, 36%)" },
  { value: "cerrada", label: "Cerrada", color: "hsl(0, 0%, 45%)" },
];

const PRIORIDADES: { value: Prioridad; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export default function IncidenciasPage() {
  const { usuario, hotelId } = useAuth();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");

  // New incidencia form
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newDepartamento, setNewDepartamento] = useState("recepcion");
  const [newPrioridad, setNewPrioridad] = useState<Prioridad>("media");
  const [newAsignado, setNewAsignado] = useState("");

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId]);

  const loadData = async () => {
    try {
      const [incRes, usrRes] = await Promise.all([
        supabase.from("incidencias").select("*").eq("hotel_id", hotelId!).order("creado_en", { ascending: false }),
        supabase.from("usuarios").select("id, nombre, departamento").eq("hotel_id", hotelId!).eq("activo", true),
      ]);
      setIncidencias(incRes.data ?? []);
      setUsuarios(usrRes.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createIncidencia = async () => {
    if (!newTitulo.trim()) {
      toast.error("Título obligatorio");
      return;
    }
    try {
      const { error } = await supabase.from("incidencias").insert({
        titulo: newTitulo,
        descripcion: newDescripcion || null,
        departamento: newDepartamento as any,
        prioridad: newPrioridad,
        asignado_a: newAsignado || null,
        hotel_id: hotelId!,
        creado_por: usuario?.id,
      });
      if (error) throw error;

      await supabase.from("actividad_incidencia").insert({
        incidencia_id: "temp",
        hotel_id: hotelId!,
        descripcion: `${usuario?.nombre} creó la incidencia "${newTitulo}"`,
        tipo: "creacion",
        usuario_id: usuario?.id,
      });

      toast.success("Crear incidencia");
      setShowNew(false);
      setNewTitulo("");
      setNewDescripcion("");
      loadData();
    } catch (err) {
      toast.error("Error al crear incidencia");
    }
  };

  const updateEstado = async (id: string, estado: Estado) => {
    try {
      await supabase.from("incidencias").update({ estado }).eq("id", id);
      setIncidencias((prev) => prev.map((i) => (i.id === id ? { ...i, estado } : i)));
      toast.success("Estado actualizado");
    } catch (err) {
      toast.error("Error");
    }
  };

  const deleteIncidencia = async (id: string) => {
    try {
      await supabase.from("incidencias").delete().eq("id", id);
      setIncidencias((prev) => prev.filter((i) => i.id !== id));
      toast.success("Incidencia eliminada");
    } catch (err) {
      toast.error("Error");
    }
  };

  const filtered = incidencias.filter((i) => {
    if (filterEstado !== "all" && i.estado !== filterEstado) return false;
    if (filterDept !== "all" && i.departamento !== filterDept) return false;
    return true;
  });

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Incidencias</h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva incidencia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva incidencia</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[13px]">Título</Label>
                <Input value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[13px]">Descripción (opcional)</Label>
                <Textarea value={newDescripcion} onChange={(e) => setNewDescripcion(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[13px]">Departamento</Label>
                  <Select value={newDepartamento} onValueChange={setNewDepartamento}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[13px]">Prioridad</Label>
                  <Select value={newPrioridad} onValueChange={(v) => setNewPrioridad(v as Prioridad)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[13px]">Asignada a</Label>
                <Select value={newAsignado} onValueChange={setNewAsignado}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createIncidencia} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {incidencias.length === 0 ? "No hay incidencias registradas" : "No hay incidencias con estos filtros"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inc) => {
            const estadoInfo = ESTADOS.find((e) => e.value === inc.estado);
            const asignado = usuarios.find((u) => u.id === inc.asignado_a);
            return (
              <Card key={inc.id} className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: estadoInfo?.color }}
                        />
                        <h3 className="font-medium text-sm truncate">{inc.titulo}</h3>
                      </div>
                      {inc.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{inc.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {DEPARTAMENTOS.find((d) => d.value === inc.departamento)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{inc.prioridad}</Badge>
                        {asignado && (
                          <span className="text-[10px] text-muted-foreground">→ {asignado.nombre}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={inc.estado} onValueChange={(v) => updateEstado(inc.id, v as Estado)}>
                        <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar esta incidencia?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteIncidencia(inc.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
