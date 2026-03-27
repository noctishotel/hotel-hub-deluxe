import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Bell, X, ChevronDown, ChevronUp, Archive, MessageSquare, Send } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

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

interface Recordatorio {
  id: string;
  incidencia_id: string;
  fecha_alerta: string;
  mensaje: string | null;
  visto: boolean;
}

interface Comentario {
  id: string;
  incidencia_id: string;
  texto: string;
  autor: string | null;
  creado_en: string;
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
  { value: "cerrada", label: "Archivada", color: "hsl(0, 0%, 45%)" },
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
  const [filterEstado, setFilterEstado] = useState<string>("activas");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recordatorios, setRecordatorios] = useState<Record<string, Recordatorio[]>>({});
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});

  const [newTitulo, setNewTitulo] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newDepartamento, setNewDepartamento] = useState("recepcion");
  const [newPrioridad, setNewPrioridad] = useState<Prioridad>("media");
  const [newAsignado, setNewAsignado] = useState("");

  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editPrioridad, setEditPrioridad] = useState<Prioridad>("media");
  const [editDept, setEditDept] = useState("");
  const [editAsignado, setEditAsignado] = useState("");

  const [alarmIncId, setAlarmIncId] = useState<string | null>(null);
  const [alarmFecha, setAlarmFecha] = useState("");
  const [alarmMensaje, setAlarmMensaje] = useState("");

  const [newComment, setNewComment] = useState("");

  const isAdmin = usuario?.rol === "admin" || usuario?.rol === "super_admin";

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId]);

  const loadData = async () => {
    try {
      const [incRes, usrRes, recRes, comRes] = await Promise.all([
        supabase.from("incidencias").select("*").eq("hotel_id", hotelId!).order("creado_en", { ascending: false }),
        supabase.from("usuarios").select("id, nombre, departamento").eq("hotel_id", hotelId!).eq("activo", true),
        supabase.from("recordatorios_incidencia").select("*").eq("hotel_id", hotelId!),
        supabase.from("comentarios_incidencia").select("*").eq("hotel_id", hotelId!).order("creado_en", { ascending: true }),
      ]);
      setIncidencias(incRes.data ?? []);
      setUsuarios(usrRes.data ?? []);

      const recMap: Record<string, Recordatorio[]> = {};
      (recRes.data ?? []).forEach((r: any) => {
        if (!recMap[r.incidencia_id]) recMap[r.incidencia_id] = [];
        recMap[r.incidencia_id].push(r);
      });
      setRecordatorios(recMap);

      const comMap: Record<string, Comentario[]> = {};
      (comRes.data ?? []).forEach((c: any) => {
        if (!comMap[c.incidencia_id]) comMap[c.incidencia_id] = [];
        comMap[c.incidencia_id].push(c);
      });
      setComentarios(comMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createIncidencia = async () => {
    if (!newTitulo.trim()) { toast.error("Título obligatorio"); return; }
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
      toast.success("Incidencia creada");
      setShowNew(false);
      setNewTitulo(""); setNewDescripcion("");
      loadData();
    } catch { toast.error("Error al crear incidencia"); }
  };

  const updateEstado = async (id: string, estado: Estado) => {
    try {
      await supabase.from("incidencias").update({ estado }).eq("id", id);
      setIncidencias((prev) => prev.map((i) => (i.id === id ? { ...i, estado } : i)));
      await supabase.from("actividad_incidencia").insert({
        incidencia_id: id, hotel_id: hotelId!,
        descripcion: `Estado cambiado a ${estado}`, tipo: "cambio", usuario_id: usuario?.id ?? null,
      });
      toast.success("Estado actualizado");
    } catch { toast.error("Error"); }
  };

  const archivar = async (id: string) => {
    await updateEstado(id, "cerrada");
  };

  const saveEdit = async (id: string) => {
    try {
      await supabase.from("incidencias").update({
        titulo: editTitulo,
        descripcion: editDescripcion || null,
        prioridad: editPrioridad,
        departamento: editDept as any,
        asignado_a: editAsignado || null,
      }).eq("id", id);
      setIncidencias((prev) => prev.map((i) => i.id === id ? {
        ...i, titulo: editTitulo, descripcion: editDescripcion || null,
        prioridad: editPrioridad, departamento: editDept, asignado_a: editAsignado || null,
      } : i));
      toast.success("Incidencia actualizada");
    } catch { toast.error("Error"); }
  };

  const deleteIncidencia = async (id: string) => {
    try {
      await supabase.from("incidencias").delete().eq("id", id);
      setIncidencias((prev) => prev.filter((i) => i.id !== id));
      toast.success("Eliminada");
    } catch { toast.error("Error"); }
  };

  const addAlarm = async () => {
    if (!alarmIncId || !alarmFecha) return;
    try {
      await supabase.from("recordatorios_incidencia").insert({
        incidencia_id: alarmIncId, hotel_id: hotelId!, usuario_id: usuario!.id,
        fecha_alerta: alarmFecha, mensaje: alarmMensaje || null,
      });
      toast.success("Recordatorio añadido");
      setAlarmIncId(null); setAlarmFecha(""); setAlarmMensaje("");
      loadData();
    } catch { toast.error("Error"); }
  };

  const deleteAlarm = async (id: string) => {
    try {
      await supabase.from("recordatorios_incidencia").delete().eq("id", id);
      loadData();
    } catch { toast.error("Error"); }
  };

  const addComment = async (incId: string) => {
    if (!newComment.trim()) return;
    try {
      await supabase.from("comentarios_incidencia").insert({
        incidencia_id: incId,
        hotel_id: hotelId!,
        autor: usuario?.id ?? null,
        texto: newComment.trim(),
      });
      setNewComment("");
      loadData();
      toast.success("Nota añadida");
    } catch { toast.error("Error al añadir nota"); }
  };

  const toggleExpand = (inc: Incidencia) => {
    if (expandedId === inc.id) {
      setExpandedId(null);
    } else {
      setExpandedId(inc.id);
      setEditTitulo(inc.titulo);
      setEditDescripcion(inc.descripcion ?? "");
      setEditPrioridad(inc.prioridad);
      setEditDept(inc.departamento);
      setEditAsignado(inc.asignado_a ?? "");
      setNewComment("");
    }
  };

  const filtered = incidencias.filter((i) => {
    if (filterEstado === "activas" && i.estado === "cerrada") return false;
    if (filterEstado === "archivadas" && i.estado !== "cerrada") return false;
    if (filterEstado !== "all" && filterEstado !== "activas" && filterEstado !== "archivadas" && i.estado !== filterEstado) return false;
    if (filterDept !== "all" && i.departamento !== filterDept) return false;
    return true;
  });

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-3 md:p-6 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Incidencias</h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nueva incidencia</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Título</Label>
                <Input value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descripción</Label>
                <Textarea value={newDescripcion} onChange={(e) => setNewDescripcion(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Departamento</Label>
                  <Select value={newDepartamento} onValueChange={setNewDepartamento}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prioridad</Label>
                  <Select value={newPrioridad} onValueChange={(v) => setNewPrioridad(v as Prioridad)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORIDADES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Asignar a</Label>
                <Select value={newAsignado} onValueChange={setNewAsignado}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>{usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={createIncidencia} className="w-full" size="sm">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="activas">Activas</SelectItem>
            <SelectItem value="archivadas">Archivadas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
            {ESTADOS.filter(e => e.value !== "cerrada").map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={!!alarmIncId} onOpenChange={(open) => !open && setAlarmIncId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-sm">Añadir recordatorio</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Input type="datetime-local" value={alarmFecha} onChange={(e) => setAlarmFecha(e.target.value)} className="h-9 text-xs" />
            <Input placeholder="Mensaje (opcional)" value={alarmMensaje} onChange={(e) => setAlarmMensaje(e.target.value)} className="h-9 text-xs" />
            <Button onClick={addAlarm} size="sm" className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {incidencias.length === 0 ? "No hay incidencias" : "Sin resultados con estos filtros"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inc) => {
            const estadoInfo = ESTADOS.find((e) => e.value === inc.estado);
            const asignado = usuarios.find((u) => u.id === inc.asignado_a);
            const isExpanded = expandedId === inc.id;
            const incRecordatorios = recordatorios[inc.id] ?? [];
            const incComentarios = comentarios[inc.id] ?? [];

            return (
              <Card key={inc.id} className={`bg-card/60 backdrop-blur-sm border-border/50 overflow-hidden ${inc.estado === "cerrada" ? "opacity-60" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => toggleExpand(inc)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: estadoInfo?.color }} />
                        <h3 className="font-medium text-sm truncate">{inc.titulo}</h3>
                      </div>
                      {inc.descripcion && !isExpanded && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 ml-4">{inc.descripcion}</p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1 ml-4">
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {DEPARTAMENTOS.find((d) => d.value === inc.departamento)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5">{inc.prioridad}</Badge>
                        {asignado && <span className="text-[10px] text-muted-foreground">→ {asignado.nombre}</span>}
                        {incRecordatorios.length > 0 && <Bell className="w-3 h-3 text-primary" />}
                        {incComentarios.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <MessageSquare className="w-3 h-3" /> {incComentarios.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {inc.estado !== "cerrada" && (
                        <Select value={inc.estado} onValueChange={(v) => { v && updateEstado(inc.id, v as Estado); }}>
                          <SelectTrigger className="h-7 w-[100px] text-[11px]" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS.filter(e => e.value !== "cerrada").map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {inc.estado === "cerrada" && (
                        <Badge variant="secondary" className="text-[10px]">Archivada</Badge>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                      {inc.estado !== "cerrada" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Título</Label>
                            <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Descripción</Label>
                            <Textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} rows={2} className="text-sm" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[11px]">Prioridad</Label>
                              <Select value={editPrioridad} onValueChange={(v) => setEditPrioridad(v as Prioridad)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{PRIORIDADES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Depto</Label>
                              <Select value={editDept} onValueChange={setEditDept}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Asignado</Label>
                              <Select value={editAsignado} onValueChange={setEditAsignado}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>{usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Notas / Comentarios */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Notas de seguimiento
                        </Label>
                        {incComentarios.length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {incComentarios.map((c) => {
                              const autorUser = usuarios.find(u => u.id === c.autor);
                              return (
                                <div key={c.id} className="bg-muted/50 rounded px-2 py-1.5 text-[11px]">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-medium">{autorUser?.nombre ?? "Sistema"}</span>
                                    <span className="text-muted-foreground">{new Date(c.creado_en).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                  <p>{c.texto}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex gap-1">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Añadir nota de seguimiento..."
                            className="h-8 text-xs flex-1"
                            onKeyDown={(e) => e.key === "Enter" && addComment(inc.id)}
                          />
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => addComment(inc.id)}>
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Recordatorios */}
                      {incRecordatorios.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-[11px]">Recordatorios</Label>
                          {incRecordatorios.map((r) => (
                            <div key={r.id} className="flex items-center gap-2 text-[11px] bg-muted/50 rounded px-2 py-1">
                              <Bell className="w-3 h-3 text-primary shrink-0" />
                              <span className="flex-1">{new Date(r.fecha_alerta).toLocaleString("es")} {r.mensaje && `— ${r.mensaje}`}</span>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteAlarm(r.id)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {inc.estado !== "cerrada" && (
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => saveEdit(inc.id)}>Guardar</Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAlarmIncId(inc.id)}>
                          <Bell className="w-3 h-3 mr-1" /> Alarma
                        </Button>
                        {inc.estado === "resuelta" && (
                          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => archivar(inc.id)}>
                            <Archive className="w-3 h-3 mr-1" /> Archivar
                          </Button>
                        )}
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                                <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteIncidencia(inc.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
