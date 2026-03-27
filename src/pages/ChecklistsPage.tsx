import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  departamento: string;
  categoria_id: string | null;
  orden: number;
  activo: boolean;
  hotel_id: string;
  tipo: string;
  color: string | null;
}

interface Categoria {
  id: string;
  nombre: string;
  departamento: string;
  hotel_id: string;
  orden: number;
  color: string | null;
  activo: boolean;
}

const DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

export default function ChecklistsPage() {
  const { usuario, hotelId } = useAuth();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [registros, setRegistros] = useState<Set<string>>(new Set());
  const [pospuestas, setPospuestas] = useState<Set<string>>(new Set());
  const [pospuestasDesdAyer, setPospuestasDesdAyer] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const currentDept = usuario?.departamento ?? "recepcion";
  const isSuperAdmin = usuario?.rol === "super_admin";
  const isAdmin = usuario?.rol === "admin";
  const canManage = isSuperAdmin || isAdmin;
  const [selectedDept, setSelectedDept] = useState<string>(currentDept);

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId, selectedDept]);

  const loadData = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const [tareasRes, categoriasRes, registrosRes, pospuestasRes, pospuestasAyerRes] = await Promise.all([
        supabase.from("tareas").select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("activo", true).order("orden"),
        supabase.from("categorias_checklist").select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("activo", true).order("orden"),
        supabase.from("registros_checklist").select("tarea_id").eq("hotel_id", hotelId!).eq("fecha", today),
        supabase.from("tareas_pospuestas").select("tarea_id").eq("hotel_id", hotelId!).eq("fecha_original", today),
        supabase.from("tareas_pospuestas").select("tarea_id").eq("hotel_id", hotelId!).eq("fecha_destino", today),
      ]);

      setTareas(tareasRes.data ?? []);
      setCategorias(categoriasRes.data ?? []);
      setRegistros(new Set((registrosRes.data ?? []).map((r) => r.tarea_id)));
      setPospuestas(new Set((pospuestasRes.data ?? []).map((p) => p.tarea_id)));
      setPospuestasDesdAyer(new Set((pospuestasAyerRes.data ?? []).map((p) => p.tarea_id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = useCallback(async (tareaId: string) => {
    const isChecked = registros.has(tareaId);
    try {
      if (isChecked) {
        await supabase
          .from("registros_checklist")
          .delete()
          .eq("tarea_id", tareaId)
          .eq("hotel_id", hotelId!)
          .eq("fecha", today);
        setRegistros((prev) => {
          const next = new Set(prev);
          next.delete(tareaId);
          return next;
        });
      } else {
        await supabase.from("registros_checklist").insert({
          tarea_id: tareaId,
          hotel_id: hotelId!,
          fecha: today,
          completado_por: usuario?.id,
        });
        setRegistros((prev) => new Set(prev).add(tareaId));
      }
    } catch (err) {
      toast.error("Error al actualizar checklist");
    }
  }, [registros, hotelId, today, usuario?.id]);

  const postponeTask = useCallback(async (tareaId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      await supabase.from("tareas_pospuestas").insert({
        tarea_id: tareaId,
        hotel_id: hotelId!,
        fecha_original: today,
        fecha_destino: tomorrow.toISOString().split("T")[0],
        pospuesto_por: usuario?.id,
      });
      setPospuestas((prev) => new Set(prev).add(tareaId));
      toast.success("Tarea pospuesta para mañana");
    } catch (err) {
      toast.error("Error al posponer tarea");
    }
  }, [hotelId, today, usuario?.id]);

  const cancelPostpone = useCallback(async (tareaId: string) => {
    try {
      await supabase
        .from("tareas_pospuestas")
        .delete()
        .eq("tarea_id", tareaId)
        .eq("hotel_id", hotelId!)
        .eq("fecha_original", today);
      setPospuestas((prev) => {
        const next = new Set(prev);
        next.delete(tareaId);
        return next;
      });
    } catch (err) {
      toast.error("Error al cancelar posponer");
    }
  }, [hotelId, today]);

  const deleteTarea = useCallback(async (tareaId: string) => {
    try {
      await supabase.from("tareas").update({ activo: false }).eq("id", tareaId);
      setTareas((prev) => prev.filter((t) => t.id !== tareaId));
      toast.success("Tarea eliminada");
    } catch (err) {
      toast.error("Error al eliminar tarea");
    }
  }, []);

  const openEditDialog = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setEditTitulo(tarea.titulo);
    setEditDescripcion(tarea.descripcion ?? "");
  };

  const saveEdit = async () => {
    if (!editingTarea) return;
    try {
      await supabase.from("tareas").update({
        titulo: editTitulo,
        descripcion: editDescripcion || null,
      }).eq("id", editingTarea.id);
      setTareas((prev) =>
        prev.map((t) =>
          t.id === editingTarea.id ? { ...t, titulo: editTitulo, descripcion: editDescripcion || null } : t
        )
      );
      setEditingTarea(null);
      toast.success("Tarea actualizada");
    } catch (err) {
      toast.error("Error al actualizar tarea");
    }
  };

  const tareasWithoutCategory = tareas.filter((t) => !t.categoria_id);
  const tareasForCategory = (catId: string) => tareas.filter((t) => t.categoria_id === catId);

  const renderTarea = (tarea: Tarea) => {
    const checked = registros.has(tarea.id);
    const postponed = pospuestas.has(tarea.id);
    const wasPostponedFromYesterday = pospuestasDesdAyer.has(tarea.id);

    return (
      <div
        key={tarea.id}
        className={`py-2 px-3 rounded-lg transition-colors ${
          checked ? "opacity-50" : ""
        } ${postponed ? "opacity-40" : ""}`}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleCheck(tarea.id)}
            disabled={postponed}
            onFocus={(e) => e.preventDefault()}
          />
          <span className={`flex-1 text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>
            {tarea.titulo}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => openEditDialog(tarea)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará "{tarea.titulo}". Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTarea(tarea.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Info de pospuesta desde ayer */}
        {wasPostponedFromYesterday && !checked && (
          <p className="ml-9 text-xs text-muted-foreground mt-0.5">
            (No realizada el día anterior)
          </p>
        )}

        {/* Botones de posponer debajo de la tarea */}
        {!checked && !postponed && (
          <div className="ml-9 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs font-bold text-muted-foreground"
              onClick={() => postponeTask(tarea.id)}
            >
              Posponer
            </Button>
          </div>
        )}
        {postponed && (
          <div className="ml-9 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-warning"
              onClick={() => cancelPostpone(tarea.id)}
            >
              Cancelar posponer
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-semibold">Checklists</h1>

      {isSuperAdmin && (
        <Tabs value={selectedDept} onValueChange={setSelectedDept}>
          <TabsList className="flex-wrap">
            {DEPARTAMENTOS.map((d) => (
              <TabsTrigger key={d.value} value={d.value} className="text-xs">
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="space-y-3">
        {categorias.map((cat) => {
          const catTareas = tareasForCategory(cat.id);
          if (catTareas.length === 0) return null;
          const completedCount = catTareas.filter((t) => registros.has(t.id)).length;

          return (
            <Collapsible key={cat.id} defaultOpen>
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3 cursor-pointer">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {cat.color && (
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      )}
                      {cat.nombre}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {completedCount}/{catTareas.length}
                    </Badge>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-1">
                    {catTareas.map(renderTarea)}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {tareasWithoutCategory.length > 0 && (
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sin categoría</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {tareasWithoutCategory.map(renderTarea)}
            </CardContent>
          </Card>
        )}

        {tareas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Sin tareas
            <p className="mt-1 text-xs">Ve a Gestión → Plantillas para crear tareas</p>
          </div>
        )}
      </div>

      {/* Dialog para editar tarea */}
      <Dialog open={!!editingTarea} onOpenChange={(open) => !open && setEditingTarea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTarea(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={!editTitulo.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
