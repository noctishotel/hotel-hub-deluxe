import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ALL_DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

interface Registro {
  id: string;
  tarea_id: string;
  completado_por: string | null;
  completado_a: string;
  fecha: string;
  hotel_id: string;
}

interface Tarea {
  id: string;
  titulo: string;
  departamento: string;
  categoria_id: string | null;
}

interface Usuario {
  id: string;
  nombre: string;
  departamento: string;
}

export default function HistorialChecklistsPage() {
  const { hotelId, usuario } = useAuth();
  const isSuperAdmin = usuario?.rol === "super_admin";
  const DEPARTAMENTOS = ALL_DEPARTAMENTOS.filter(d => d.value !== "administracion" || isSuperAdmin);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [tareas, setTareas] = useState<Record<string, Tarea>>({});
  const [usuarios, setUsuarios] = useState<Record<string, Usuario>>({});
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterDept, setFilterDept] = useState("all");

  if (usuario && !isSuperAdmin) {
    return <Navigate to="/panel" replace />;
  }

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId, filterDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regRes, tarRes, usrRes] = await Promise.all([
        supabase.from("registros_checklist").select("*").eq("hotel_id", hotelId!).eq("fecha", filterDate).order("completado_a", { ascending: false }),
        supabase.from("tareas").select("id, titulo, departamento, categoria_id").eq("hotel_id", hotelId!),
        supabase.from("usuarios").select("id, nombre, departamento").eq("hotel_id", hotelId!),
      ]);

      setRegistros(regRes.data ?? []);

      const tarMap: Record<string, Tarea> = {};
      (tarRes.data ?? []).forEach((t) => (tarMap[t.id] = t));
      setTareas(tarMap);

      const usrMap: Record<string, Usuario> = {};
      (usrRes.data ?? []).forEach((u) => (usrMap[u.id] = u));
      setUsuarios(usrMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = registros.filter((r) => {
    if (filterDept === "all") return true;
    const tarea = tareas[r.tarea_id];
    return tarea?.departamento === filterDept;
  });

  // Group by department
  const byDept: Record<string, typeof filtered> = {};
  filtered.forEach((r) => {
    const tarea = tareas[r.tarea_id];
    const dept = tarea?.departamento ?? "otro";
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(r);
  });

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-semibold">Registro de checklists completados</h1>

      <div className="flex gap-2 flex-wrap">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-[160px] h-9"
        />
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {DEPARTAMENTOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Sin registros en este periodo</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDept).map(([dept, regs]) => {
            const deptLabel = DEPARTAMENTOS.find((d) => d.value === dept)?.label ?? dept;
            return (
              <Card key={dept} className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{deptLabel}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {regs.map((reg) => {
                    const tarea = tareas[reg.tarea_id];
                    const usr = reg.completado_por ? usuarios[reg.completado_por] : null;
                    return (
                      <div key={reg.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{tarea?.titulo ?? reg.tarea_id}</p>
                          {usr && <p className="text-[11px] text-muted-foreground">por {usr.nombre}</p>}
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                          {new Date(reg.completado_a).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
