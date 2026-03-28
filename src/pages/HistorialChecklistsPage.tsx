import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  CheckCircle2, AlertTriangle, Users, Activity,
  ClipboardList, Clock, TrendingUp,
} from "lucide-react";

const DEPT_LABELS: Record<string, string> = {
  recepcion: "Recepción",
  limpieza: "Limpieza",
  fyb: "F&B",
  mantenimiento: "Mantenimiento",
  administracion: "Administración",
  direccion: "Dirección",
};

const STATUS_LABELS: Record<string, string> = {
  abierta: "Abierta",
  en_proceso: "En proceso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

const CHART_COLORS = [
  "hsl(220, 14%, 20%)",
  "hsl(142, 52%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(220, 9%, 60%)",
  "hsl(200, 60%, 45%)",
];

function fmt(n: number) {
  return n.toFixed(1).replace(/\.0$/, "");
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

function startOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function HistorialChecklistsPage() {
  const { hotelId, usuario, loading: authLoading } = useAuth();
  const isSuperAdmin = usuario?.rol === "super_admin";

  const [loading, setLoading] = useState(true);
  const [tareas, setTareas] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    if (hotelId && isSuperAdmin) loadAll();
  }, [hotelId, isSuperAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth();
      const [tarRes, regRes, incRes, usrRes] = await Promise.all([
        supabase.from("tareas").select("id, titulo, departamento, activo, tipo").eq("hotel_id", hotelId!),
        supabase.from("registros_checklist").select("id, tarea_id, completado_por, completado_a, fecha").eq("hotel_id", hotelId!).gte("fecha", monthStart),
        supabase.from("incidencias").select("id, departamento, estado, prioridad, creado_en, updated_at, creado_por, titulo").eq("hotel_id", hotelId!).gte("creado_en", monthStart + "T00:00:00"),
        supabase.from("usuarios").select("id, nombre, departamento, activo, auth_id").eq("hotel_id", hotelId!),
      ]);
      setTareas(tarRes.data ?? []);
      setRegistros(regRes.data ?? []);
      setIncidencias(incRes.data ?? []);
      setUsuarios(usrRes.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const today = todayStr();
    const activeTareas = tareas.filter(t => t.activo && t.tipo === "tarea");
    const todayRegs = registros.filter(r => r.fecha === today);
    const completedToday = todayRegs.length;
    const totalTasksToday = activeTareas.length;
    const openIncidents = incidencias.filter(i => i.estado === "abierta" || i.estado === "en_proceso").length;
    const resolvedThisMonth = incidencias.filter(i => i.estado === "resuelta" || i.estado === "cerrada").length;
    const activeUsers = usuarios.filter(u => u.activo).length;
    return { completedToday, totalTasksToday, openIncidents, resolvedThisMonth, activeUsers };
  }, [tareas, registros, incidencias, usuarios]);

  // ─── SECTION A: Team Performance ───
  const deptPerformance = useMemo(() => {
    const today = todayStr();
    const weekStart = startOfWeek();
    const activeTareas = tareas.filter(t => t.activo && t.tipo === "tarea");
    const depts = [...new Set(activeTareas.map(t => t.departamento))];

    return depts.map(dept => {
      const deptTareas = activeTareas.filter(t => t.departamento === dept);
      const deptTareaIds = new Set(deptTareas.map(t => t.id));
      const total = deptTareas.length;

      const todayCompleted = registros.filter(r => r.fecha === today && deptTareaIds.has(r.tarea_id)).length;
      const weekCompleted = registros.filter(r => r.fecha >= weekStart && deptTareaIds.has(r.tarea_id));
      const weekDays = Math.max(1, Math.ceil((Date.now() - new Date(weekStart).getTime()) / 86400000));
      const monthCompleted = registros.filter(r => deptTareaIds.has(r.tarea_id));

      return {
        dept,
        label: DEPT_LABELS[dept] ?? dept,
        total,
        todayPct: total > 0 ? (todayCompleted / total) * 100 : 0,
        weekPct: total > 0 ? (weekCompleted.length / (total * weekDays)) * 100 : 0,
        monthCompleted: monthCompleted.length,
      };
    }).sort((a, b) => b.todayPct - a.todayPct);
  }, [tareas, registros]);

  // ─── SECTION B: Incidents ───
  const incidentStats = useMemo(() => {
    const weekStart = startOfWeek();
    const weekIncidents = incidencias.filter(i => i.creado_en >= weekStart + "T00:00:00");
    const byStatus: Record<string, number> = {};
    const byDept: Record<string, number> = {};

    incidencias.forEach(i => {
      byStatus[i.estado] = (byStatus[i.estado] || 0) + 1;
      byDept[i.departamento] = (byDept[i.departamento] || 0) + 1;
    });

    const resolved = incidencias.filter(i => i.estado === "resuelta" || i.estado === "cerrada");
    let avgResolutionHours = 0;
    if (resolved.length > 0) {
      const totalHours = resolved.reduce((sum, i) => {
        const created = new Date(i.creado_en).getTime();
        const updated = new Date(i.updated_at).getTime();
        return sum + (updated - created) / 3600000;
      }, 0);
      avgResolutionHours = totalHours / resolved.length;
    }

    const statusData = Object.entries(byStatus).map(([key, value]) => ({
      name: STATUS_LABELS[key] ?? key,
      value,
    }));

    const deptData = Object.entries(byDept).map(([key, value]) => ({
      name: DEPT_LABELS[key] ?? key,
      value,
    })).sort((a, b) => b.value - a.value);

    return {
      totalMonth: incidencias.length,
      totalWeek: weekIncidents.length,
      avgResolutionHours,
      statusData,
      deptData,
    };
  }, [incidencias]);

  if (authLoading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;
  }

  if (!usuario || !isSuperAdmin) {
    return <Navigate to="/panel" replace />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Dashboard Dirección</h1>
        <p className="text-sm text-muted-foreground">Resumen ejecutivo del hotel</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando datos...</div>
      ) : (
        <>
          {/* SECTION D — Quick KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Tareas hoy"
              value={`${kpis.completedToday} / ${kpis.totalTasksToday}`}
              accent="text-[hsl(var(--success))]"
            />
            <KpiCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Incidencias abiertas"
              value={String(kpis.openIncidents)}
              accent="text-[hsl(var(--warning))]"
            />
            <KpiCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Resueltas este mes"
              value={String(kpis.resolvedThisMonth)}
              accent="text-[hsl(var(--success))]"
            />
            <KpiCard
              icon={<Users className="w-5 h-5" />}
              label="Usuarios activos"
              value={String(kpis.activeUsers)}
              accent="text-primary"
            />
          </div>

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="performance" className="text-xs">Rendimiento</TabsTrigger>
              <TabsTrigger value="incidents" className="text-xs">Incidencias</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">Actividad</TabsTrigger>
            </TabsList>

            {/* SECTION A — Team Performance */}
            <TabsContent value="performance" className="space-y-4">
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    Completado por departamento — Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptPerformance} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                        <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${fmt(v)}%`} />
                        <Bar dataKey="todayPct" name="Hoy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                {deptPerformance.map(d => (
                  <Card key={d.dept} className="bg-card/60 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">{d.label}</p>
                      <div className="mt-2 space-y-1.5">
                        <ProgressRow label="Hoy" pct={d.todayPct} />
                        <ProgressRow label="Semana (promedio)" pct={d.weekPct} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {d.monthCompleted} tareas completadas este mes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* SECTION B — Incidents */}
            <TabsContent value="incidents" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MiniStat label="Esta semana" value={String(incidentStats.totalWeek)} />
                <MiniStat label="Este mes" value={String(incidentStats.totalMonth)} />
                <MiniStat label="Tiempo resolución (prom.)" value={`${fmt(incidentStats.avgResolutionHours)}h`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Por estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={incidentStats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {incidentStats.statusData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Por departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incidentStats.deptData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" name="Incidencias" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SECTION C — Activity */}
            <TabsContent value="activity" className="space-y-4">
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Actividad por departamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      registros.reduce((acc: Record<string, number>, r) => {
                        const tarea = tareas.find(t => t.id === r.tarea_id);
                        const dept = tarea?.departamento ?? "otro";
                        acc[dept] = (acc[dept] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-sm">{DEPT_LABELS[dept] ?? dept}</span>
                          <span className="text-sm font-semibold tabular-nums">{count} registros</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Equipo activo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {usuarios.filter(u => u.activo).map(u => {
                      const userRegs = registros.filter(r => r.completado_por === u.id).length;
                      return (
                        <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{u.nombre}</p>
                            <p className="text-xs text-muted-foreground">{DEPT_LABELS[u.departamento] ?? u.departamento}</p>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{userRegs} tareas este mes</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 flex flex-col gap-1">
        <div className={`${accent}`}>{icon}</div>
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-10 text-right">{fmt(pct)}%</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardContent className="p-3 text-center">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
