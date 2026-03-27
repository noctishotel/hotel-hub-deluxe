import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Clock, ListChecks, Eye } from "lucide-react";

const DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

interface StructuredNota {
  _structured: true;
  listaTareas: string;
  citas: Record<string, string>;
}

interface AgendaItem {
  id: string;
  fecha: string;
  nota: string | null;
  usuario_id: string | null;
  hotel_id: string;
  departamento: string | null;
  created_at: string;
  updated_at: string;
}

function parseNota(raw: string | null): StructuredNota | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed._structured) return parsed as StructuredNota;
  } catch {}
  return null;
}

function notaToPlainText(raw: string | null): string {
  if (!raw) return "";
  const structured = parseNota(raw);
  if (!structured) return raw;
  const parts: string[] = [];
  if (structured.listaTareas) parts.push(`Tareas:\n${structured.listaTareas}`);
  if (structured.citas && Object.keys(structured.citas).length > 0) {
    const citaLines = Object.entries(structured.citas)
      .map(([h, v]) => `  ${h} — ${v}`)
      .join("\n");
    parts.push(`Agenda:\n${citaLines}`);
  }
  return parts.join("\n\n");
}

const HOURS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function AgendaPage() {
  const { usuario, hotelId } = useAuth();
  const isSuperAdmin = usuario?.rol === "super_admin";

  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [listaTareas, setListaTareas] = useState("");
  const [citas, setCitas] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  // Department selection: super admin can switch, others fixed to their own
  const [selectedDept, setSelectedDept] = useState<string>("");

  useEffect(() => {
    if (usuario) {
      setSelectedDept(usuario.departamento);
    }
  }, [usuario]);

  useEffect(() => {
    if (hotelId && selectedDept) loadAgenda();
  }, [hotelId, selectedDept]);

  const loadAgenda = async () => {
    if (!hotelId || !selectedDept) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("agenda")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("departamento", selectedDept as any)
        .order("fecha", { ascending: false });

      setItems((data as AgendaItem[]) ?? []);

      const todayItem = data?.find((i: any) => i.fecha === today);
      if (todayItem) {
        const structured = parseNota(todayItem.nota);
        if (structured) {
          setListaTareas(structured.listaTareas ?? "");
          setCitas(structured.citas ?? {});
        } else {
          setListaTareas(todayItem.nota ?? "");
          setCitas({});
        }
      } else {
        setListaTareas("");
        setCitas({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildNota = useCallback((): string => {
    const data: StructuredNota = { _structured: true, listaTareas, citas };
    return JSON.stringify(data);
  }, [listaTareas, citas]);

  const saveNota = async () => {
    try {
      const notaJson = buildNota();
      const existing = items.find((i) => i.fecha === today);
      if (existing) {
        await supabase
          .from("agenda")
          .update({
            nota: notaJson,
            usuario_id: usuario!.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("agenda").insert({
          fecha: today,
          nota: notaJson,
          usuario_id: usuario!.id,
          hotel_id: hotelId!,
          departamento: selectedDept as any,
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

  const deptLabel = DEPARTAMENTOS.find((d) => d.value === selectedDept)?.label ?? selectedDept;

  if (loading)
    return (
      <div className="p-6 text-center text-muted-foreground">Cargando...</div>
    );

  return (
    <div className="p-3 md:p-6 space-y-3 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Agenda — {deptLabel}</h1>
        <span className="text-xs text-muted-foreground">{today}</span>
      </div>

      {/* Super admin: department selector */}
      {isSuperAdmin && (
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary shrink-0" />
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de tareas */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListChecks className="w-4 h-4 text-primary" />
            Lista de tareas
          </div>
          <Textarea
            placeholder="Una tarea por línea..."
            value={listaTareas}
            onChange={(e) => setListaTareas(e.target.value)}
            rows={4}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Agenda por horas */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Clock className="w-4 h-4 text-primary" />
            Agenda por horas
          </div>
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-11 shrink-0 font-mono">
                  {hour}
                </span>
                <Input
                  className="h-8 text-sm"
                  placeholder="—"
                  value={citas[hour] ?? ""}
                  onChange={(e) => updateCita(hour, e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guardar */}
      <Button onClick={saveNota} size="sm" className="w-full">
        Guardar agenda
      </Button>

      {/* Historial */}
      {items.filter((i) => i.fecha !== today).length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-medium text-muted-foreground">
            Historial
          </h2>
          {items
            .filter((i) => i.fecha !== today)
            .map((item) => (
              <Card
                key={item.id}
                className="bg-card/60 backdrop-blur-sm border-border/50"
              >
                <CardContent className="p-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {item.fecha}
                    </p>
                    <p className="text-xs mt-1 whitespace-pre-wrap line-clamp-3">
                      {notaToPlainText(item.nota)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive shrink-0"
                    onClick={() => deleteItem(item.id)}
                  >
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
