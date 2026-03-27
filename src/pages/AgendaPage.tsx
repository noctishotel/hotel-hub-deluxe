import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Trash2, Clock } from "lucide-react";

interface StructuredNota {
  _structured: true;
  objetivos: string;
  listaTareas: string;
  citas: Record<string, string>;
  notas: string;
}

interface AgendaItem {
  id: string;
  fecha: string;
  nota: string | null;
  usuario_id: string;
  hotel_id: string;
  alerta_fecha: string | null;
  alerta_mensaje: string | null;
  created_at: string;
  updated_at: string;
}

function parseNota(raw: string | null): StructuredNota | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed._structured) return parsed as StructuredNota;
  } catch {
    // Not JSON
  }
  return null;
}

function notaToPlainText(raw: string | null): string {
  if (!raw) return "";
  const structured = parseNota(raw);
  if (!structured) return raw;
  const parts: string[] = [];
  if (structured.objetivos) parts.push(`Objetivos:\n${structured.objetivos}`);
  if (structured.listaTareas) parts.push(`Tareas:\n${structured.listaTareas}`);
  if (structured.citas && Object.keys(structured.citas).length > 0) {
    const citaLines = Object.entries(structured.citas).map(([h, v]) => `  ${h} — ${v}`).join("\n");
    parts.push(`Citas:\n${citaLines}`);
  }
  if (structured.notas) parts.push(`Notas:\n${structured.notas}`);
  return parts.join("\n\n");
}

const HOURS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function AgendaPage() {
  const { usuario, hotelId } = useAuth();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Structured fields
  const [objetivos, setObjetivos] = useState("");
  const [listaTareas, setListaTareas] = useState("");
  const [citas, setCitas] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState("");

  const [alertaFecha, setAlertaFecha] = useState("");
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (hotelId && usuario) loadAgenda();
  }, [hotelId, usuario]);

  const loadAgenda = async () => {
    try {
      const { data } = await supabase
        .from("agenda")
        .select("*")
        .eq("hotel_id", hotelId!)
        .eq("usuario_id", usuario!.id)
        .order("fecha", { ascending: false });
      setItems(data ?? []);

      const todayItem = data?.find((i) => i.fecha === today);
      if (todayItem) {
        const structured = parseNota(todayItem.nota);
        if (structured) {
          setObjetivos(structured.objetivos ?? "");
          setListaTareas(structured.listaTareas ?? "");
          setCitas(structured.citas ?? {});
          setNotas(structured.notas ?? "");
        } else {
          setObjetivos(todayItem.nota ?? "");
        }
        setAlertaFecha(todayItem.alerta_fecha ?? "");
        setAlertaMensaje(todayItem.alerta_mensaje ?? "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildNota = useCallback((): string => {
    const data: StructuredNota = {
      _structured: true,
      objetivos,
      listaTareas,
      citas,
      notas,
    };
    return JSON.stringify(data);
  }, [objetivos, listaTareas, citas, notas]);

  const saveNota = async () => {
    try {
      const notaJson = buildNota();
      const existing = items.find((i) => i.fecha === today);
      if (existing) {
        await supabase.from("agenda").update({
          nota: notaJson,
          alerta_fecha: alertaFecha || null,
          alerta_mensaje: alertaMensaje || null,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("agenda").insert({
          fecha: today,
          nota: notaJson,
          usuario_id: usuario!.id,
          hotel_id: hotelId!,
          alerta_fecha: alertaFecha || null,
          alerta_mensaje: alertaMensaje || null,
        });
      }
      toast.success("Guardado");
      loadAgenda();
    } catch {
      toast.error("Error al guardar");
    }
  };

  const updateCita = (hour: string, value: string) => {
    setCitas((prev) => {
      const next = { ...prev };
      if (value) next[hour] = value;
      else delete next[hour];
      return next;
    });
  };

  const deleteItem = async (id: string) => {
    try {
      await supabase.from("agenda").delete().eq("id", id);
      loadAgenda();
    } catch {
      toast.error("Error");
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="text-sm text-muted-foreground">{today}</p>

      {/* Objetivos */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Objetivos del día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="¿Qué quieres lograr hoy?"
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Lista de tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Una tarea por línea..."
            value={listaTareas}
            onChange={(e) => setListaTareas(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Cronograma */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Cronograma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0 font-mono">{hour}</span>
              <Input
                className="h-8 text-sm"
                placeholder="—"
                value={citas[hour] ?? ""}
                onChange={(e) => updateCita(hour, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notas generales */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Notas generales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notas adicionales..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Alerta */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Recordatorio</Label>
              <Input type="datetime-local" value={alertaFecha} onChange={(e) => setAlertaFecha(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nota del recordatorio</Label>
              <Input placeholder="Mensaje..." value={alertaMensaje} onChange={(e) => setAlertaMensaje(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <Button onClick={saveNota} size="sm" className="w-full">Guardar agenda</Button>
        </CardContent>
      </Card>

      {/* Historial */}
      {items.filter((i) => i.fecha !== today).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Historial</h2>
          {items.filter((i) => i.fecha !== today).map((item) => (
            <Card key={item.id} className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardContent className="p-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{item.fecha}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{notaToPlainText(item.nota)}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
