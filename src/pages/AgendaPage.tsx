import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Eye, ChevronLeft, ChevronRight, StickyNote, Calendar } from "lucide-react";

const ALL_DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

interface StructuredNota {
  _structured: true;
  notas: string;
  citas: Record<string, string>;
}

function parseNota(raw: string | null): StructuredNota | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed._structured) return parsed as StructuredNota;
  } catch {}
  return null;
}

const HOURS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, "0")}:00`;
});

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function MiniCalendar({ selectedDate, onSelectDate }: { selectedDate: string; onSelectDate: (d: string) => void }) {
  const sel = new Date(selectedDate + "T00:00:00");
  const [viewYear, setViewYear] = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const adjustedFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const todayStr = new Date().toISOString().split("T")[0];

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">{monthNames[viewMonth]} {viewYear}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayNames.map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: adjustedFirst }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateStr)}
              className={`text-xs py-1 rounded transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground font-bold"
                  : isToday
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-muted"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const { usuario, hotelId } = useAuth();
  const isSuperAdmin = usuario?.rol === "super_admin";

  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState("");
  const [citas, setCitas] = useState<Record<string, string>>({});
  const [existingId, setExistingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const DEPARTAMENTOS = ALL_DEPARTAMENTOS.filter(d => d.value !== "administracion" || isSuperAdmin);
  const [selectedDept, setSelectedDept] = useState<string>("");

  useEffect(() => {
    if (usuario) setSelectedDept(usuario.departamento);
  }, [usuario]);

  const loadAgenda = useCallback(async () => {
    if (!hotelId || !selectedDept) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("agenda")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("departamento", selectedDept as any)
        .eq("fecha", selectedDate)
        .maybeSingle();

      if (data) {
        const structured = parseNota(data.nota);
        if (structured) {
          setNotas(structured.notas ?? "");
          setCitas(structured.citas ?? {});
        } else {
          setNotas(data.nota ?? "");
          setCitas({});
        }
        setExistingId(data.id);
      } else {
        setNotas("");
        setCitas({});
        setExistingId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hotelId, selectedDept, selectedDate]);

  useEffect(() => {
    if (hotelId && selectedDept) loadAgenda();
  }, [hotelId, selectedDept, selectedDate, loadAgenda]);

  const buildNota = useCallback((): string => {
    const data: StructuredNota = { _structured: true, notas, citas };
    return JSON.stringify(data);
  }, [notas, citas]);

  const saveNota = async () => {
    try {
      const notaJson = buildNota();
      if (existingId) {
        await supabase
          .from("agenda")
          .update({
            nota: notaJson,
            usuario_id: usuario!.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId);
      } else {
        const { data } = await supabase.from("agenda").insert({
          fecha: selectedDate,
          nota: notaJson,
          usuario_id: usuario!.id,
          hotel_id: hotelId!,
          departamento: selectedDept as any,
        }).select("id").single();
        if (data) setExistingId(data.id);
      }
      toast.success("Guardado");
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

  const deptLabel = DEPARTAMENTOS.find((d) => d.value === selectedDept)?.label ?? selectedDept;
  const isReadOnly = isSuperAdmin && selectedDept !== usuario?.departamento;

  return (
    <div className="p-3 md:p-6 space-y-3 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Agenda — {deptLabel}</h1>
        <span className="text-xs text-muted-foreground">{selectedDate}</span>
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
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Cargando...</div>
      ) : (
        <>
          {/* 1st — Notas */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="w-4 h-4 text-primary" />
                Notas
              </div>
              <Textarea
                placeholder="Escribe notas para este día..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                className="text-sm"
                readOnly={isReadOnly}
              />
            </CardContent>
          </Card>

          {/* 2nd — Agenda por horas */}
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
                      readOnly={isReadOnly}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3rd — Calendario mensual */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                Calendario mensual
              </div>
              <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </CardContent>
          </Card>

          {/* Guardar */}
          {!isReadOnly && (
            <Button onClick={saveNota} size="sm" className="w-full">
              Guardar agenda
            </Button>
          )}
        </>
      )}
    </div>
  );
}
