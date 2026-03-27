import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Trash2, Share2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const ALL_DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

const TIPOS_TAREA = [
  { value: "tarea", label: "Tarea (check)" },
  { value: "titulo", label: "Título (encabezado)" },
  { value: "texto_libre", label: "Texto libre (explicación)" },
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
  const [editTipo, setEditTipo] = useState("tarea");
  const [notaExtra, setNotaExtra] = useState("");
  const [notaExtraId, setNotaExtraId] = useState<string | null>(null);
  const [savingNota, setSavingNota] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const currentDept = usuario?.departamento ?? "recepcion";
  const isSuperAdmin = usuario?.rol === "super_admin";
  const isAdmin = usuario?.rol === "admin";
  const canManage = isSuperAdmin || isAdmin;
  const [selectedDept, setSelectedDept] = useState<string>(currentDept);

  useEffect(() => {
    if (usuario?.departamento && !isSuperAdmin) {
      setSelectedDept(usuario.departamento);
    }
  }, [usuario?.departamento]);

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId, selectedDept]);

  const loadData = async () => {
    try {
      const [tareasRes, categoriasRes, registrosRes, pospuestasRes, pospuestasAyerRes, notaRes] = await Promise.all([
        supabase.from("tareas").select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("activo", true).order("orden"),
        supabase.from("categorias_checklist").select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("activo", true).order("orden"),
        supabase.from("registros_checklist").select("tarea_id").eq("hotel_id", hotelId!).eq("fecha", today),
        supabase.from("tareas_pospuestas").select("tarea_id").eq("hotel_id", hotelId!).eq("fecha_original", today),
        supabase.from("tareas_pospuestas").select("tarea_id").eq("hotel_id", hotelId!).eq("fecha_destino", today),
        supabase.from("notas_checklist" as any).select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("fecha", today).eq("usuario_id", usuario?.id).maybeSingle(),
      ]);

      setTareas(tareasRes.data ?? []);
      setCategorias(categoriasRes.data ?? []);
      setRegistros(new Set((registrosRes.data ?? []).map((r: any) => r.tarea_id)));
      setPospuestas(new Set((pospuestasRes.data ?? []).map((p: any) => p.tarea_id)));
      setPospuestasDesdAyer(new Set((pospuestasAyerRes.data ?? []).map((p: any) => p.tarea_id)));
      if (notaRes.data) {
        setNotaExtra((notaRes.data as any).nota ?? "");
        setNotaExtraId((notaRes.data as any).id);
      } else {
        setNotaExtra("");
        setNotaExtraId(null);
      }
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
    setEditTipo(tarea.tipo);
  };

  const saveEdit = async () => {
    if (!editingTarea) return;
    try {
      await supabase.from("tareas").update({
        titulo: editTitulo,
        descripcion: editDescripcion || null,
        tipo: editTipo,
      }).eq("id", editingTarea.id);
      setTareas((prev) =>
        prev.map((t) =>
          t.id === editingTarea.id
            ? { ...t, titulo: editTitulo, descripcion: editDescripcion || null, tipo: editTipo }
            : t
        )
      );
      setEditingTarea(null);
      toast.success("Tarea actualizada");
    } catch (err) {
      toast.error("Error al actualizar tarea");
    }
  };

  const saveNotaExtra = useCallback(async () => {
    if (!hotelId || !usuario?.id) return;
    setSavingNota(true);
    try {
      if (notaExtraId) {
        await supabase.from("notas_checklist" as any).update({ nota: notaExtra } as any).eq("id", notaExtraId);
      } else {
        const { data } = await supabase.from("notas_checklist" as any).insert({
          hotel_id: hotelId,
          departamento: selectedDept,
          fecha: today,
          nota: notaExtra,
          usuario_id: usuario.id,
        } as any).select("id").single();
        if (data) setNotaExtraId((data as any).id);
      }
      toast.success("Nota guardada");
    } catch (err) {
      toast.error("Error al guardar nota");
    } finally {
      setSavingNota(false);
    }
  }, [notaExtra, notaExtraId, hotelId, usuario?.id, selectedDept, today]);


  const generateWhatsAppSummary = () => {
    const deptLabel = DEPARTAMENTOS.find((d) => d.value === selectedDept)?.label ?? selectedDept;
    const dateFormatted = new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let text = `CHECKLIST ${deptLabel.toUpperCase()}\n${dateFormatted}\n`;
    text += `Usuario: ${usuario?.nombre ?? "—"}\n`;
    text += "─".repeat(30) + "\n\n";

    const renderTareasForSummary = (tareasToRender: Tarea[]) => {
      let section = "";
      for (const t of tareasToRender) {
        if (t.tipo === "titulo") {
          section += `\n*${t.titulo.toUpperCase()}*\n`;
        } else if (t.tipo === "texto_libre") {
          section += `  ${t.titulo}\n`;
        } else {
          const checked = registros.has(t.id);
          const postponed = pospuestas.has(t.id);
          const wasFromYesterday = pospuestasDesdAyer.has(t.id);
          let status = checked ? "OK" : postponed ? "POSPUESTA" : "PENDIENTE";
          if (wasFromYesterday && !checked) status += " (pendiente del dia anterior)";
          section += `- ${t.titulo}: ${status}\n`;
        }
      }
      return section;
    };

    for (const cat of categorias) {
      const catTareas = tareas.filter((t) => t.categoria_id === cat.id);
      if (catTareas.length === 0) continue;
      const completed = catTareas.filter((t) => t.tipo === "tarea" && registros.has(t.id)).length;
      const total = catTareas.filter((t) => t.tipo === "tarea").length;
      text += `*${cat.nombre.toUpperCase()}* (${completed}/${total})\n`;
      text += renderTareasForSummary(catTareas);
      text += "\n";
    }

    const sinCat = tareas.filter((t) => !t.categoria_id);
    if (sinCat.length > 0) {
      text += `*SIN CATEGORIA*\n`;
      text += renderTareasForSummary(sinCat);
      text += "\n";
    }

    const totalTareas = tareas.filter((t) => t.tipo === "tarea");
    const totalCompletadas = totalTareas.filter((t) => registros.has(t.id)).length;
    text += "─".repeat(30) + "\n";
    text += `TOTAL: ${totalCompletadas}/${totalTareas.length} tareas completadas`;

    if (notaExtra.trim()) {
      text += `\n\n*TAREAS ADICIONALES*\n${notaExtra.trim()}`;
    }

    return text;
  };

  const shareWhatsApp = () => {
    const text = generateWhatsAppSummary();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const tareasWithoutCategory = tareas.filter((t) => !t.categoria_id);
  const tareasForCategory = (catId: string) => tareas.filter((t) => t.categoria_id === catId);

  const renderTarea = (tarea: Tarea) => {
    const checked = registros.has(tarea.id);
    const postponed = pospuestas.has(tarea.id);
    const wasPostponedFromYesterday = pospuestasDesdAyer.has(tarea.id);

    // Render as title header
    if (tarea.tipo === "titulo") {
      return (
        <div key={tarea.id} className="flex items-center gap-2 pt-3 pb-1 px-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex-1">
            {tarea.titulo}
          </h3>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(tarea)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar título?</AlertDialogTitle>
                    <AlertDialogDescription>Se eliminará "{tarea.titulo}".</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTarea(tarea.id)}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      );
    }

    // Render as free text / explanation
    if (tarea.tipo === "texto_libre") {
      return (
        <div key={tarea.id} className="flex items-start gap-2 py-1.5 px-3">
          <p className="flex-1 text-xs text-muted-foreground italic leading-relaxed pl-2 border-l-2 border-border">
            {tarea.titulo}
          </p>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(tarea)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar texto?</AlertDialogTitle>
                    <AlertDialogDescription>Se eliminará este texto libre.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTarea(tarea.id)}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      );
    }

    // Default: checkable task
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
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(tarea)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                      <AlertDialogDescription>Se eliminará "{tarea.titulo}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTarea(tarea.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {wasPostponedFromYesterday && !checked && (
          <p className="ml-9 text-xs text-muted-foreground mt-0.5">
            (No realizada el día anterior)
          </p>
        )}

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

  // Count only checkable tasks for badges
  const countCheckable = (tareasArr: Tarea[]) => tareasArr.filter((t) => t.tipo === "tarea");

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Checklists</h1>
        {tareas.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={shareWhatsApp}
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
        )}
      </div>

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
          const checkable = countCheckable(catTareas);
          const completedCount = checkable.filter((t) => registros.has(t.id)).length;

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
                    {checkable.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {completedCount}/{checkable.length}
                      </Badge>
                    )}
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

      {/* Cuadro de texto libre para tareas adicionales (mantenimiento) */}
      {selectedDept === "mantenimiento" && (
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Tareas adicionales realizadas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Textarea
              placeholder="Anota aquí las tareas realizadas que no estaban en la lista..."
              value={notaExtra}
              onChange={(e) => setNotaExtra(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={saveNotaExtra}
              disabled={savingNota}
              className="w-full sm:w-auto"
            >
              {savingNota ? "Guardando..." : "Guardar nota"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog para editar tarea */}
      <Dialog open={!!editingTarea} onOpenChange={(open) => !open && setEditingTarea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar elemento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={editTipo} onValueChange={setEditTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_TAREA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editTipo === "titulo" ? "Título" : editTipo === "texto_libre" ? "Texto" : "Título de la tarea"}</Label>
              {editTipo === "texto_libre" ? (
                <Textarea value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} rows={3} />
              ) : (
                <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
              )}
            </div>
            {editTipo === "tarea" && (
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
              </div>
            )}
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
