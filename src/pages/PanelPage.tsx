import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckSquare, AlertTriangle, Bell, Users, ArrowRight } from "lucide-react";

interface DeptProgress {
  departamento: string;
  total: number;
  completed: number;
}

const DEPT_LABELS: Record<string, string> = {
  recepcion: "Recepción",
  limpieza: "Limpieza",
  fyb: "F&B",
  mantenimiento: "Mantenimiento",
  administracion: "Administración",
};

export default function PanelPage() {
  const { hotelId, usuario } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ abiertas: 0, alertas: 0, equipo: 0 });
  const [checklistTotal, setChecklistTotal] = useState(0);
  const [checklistDone, setChecklistDone] = useState(0);
  const [deptProgress, setDeptProgress] = useState<DeptProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = usuario?.rol === "super_admin";

  const today = new Date();
  const dateStr = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!hotelId) return;
    loadAll();
  }, [hotelId]);

  const loadAll = async () => {
    try {
      const todayISO = new Date().toISOString().split("T")[0];

      // Incidencias abiertas
      const { data: inc } = await supabase
        .from("incidencias")
        .select("estado")
        .eq("hotel_id", hotelId!)
        .in("estado", ["abierta", "en_proceso"]);

      // Alertas pendientes
      const { data: alertas } = await supabase
        .from("alertas_globales")
        .select("id")
        .eq("hotel_id", hotelId!)
        .eq("atendida", false);

      // Equipo activo
      const { data: equipo } = await supabase
        .from("usuarios")
        .select("id")
        .eq("hotel_id", hotelId!)
        .eq("activo", true);

      // Tareas activas con departamento
      const { data: tareas } = await supabase
        .from("tareas")
        .select("id, departamento")
        .eq("hotel_id", hotelId!)
        .eq("activo", true);

      // Registros completados hoy
      const { data: registros } = await supabase
        .from("registros_checklist")
        .select("tarea_id")
        .eq("hotel_id", hotelId!)
        .eq("fecha", todayISO);

      const completedIds = new Set(registros?.map((r) => r.tarea_id) ?? []);

      setStats({
        abiertas: inc?.filter((i) => i.estado === "abierta").length ?? 0,
        alertas: alertas?.length ?? 0,
        equipo: equipo?.length ?? 0,
      });

      setChecklistTotal(tareas?.length ?? 0);
      setChecklistDone(completedIds.size);

      // Department progress (exclude direccion; exclude administracion for non-super_admin)
      const deptMap: Record<string, { total: number; completed: number }> = {};
      (tareas ?? []).forEach((t) => {
        if (t.departamento === "direccion") return;
        if (t.departamento === "administracion" && !isSuperAdmin) return;
        if (!deptMap[t.departamento]) deptMap[t.departamento] = { total: 0, completed: 0 };
        deptMap[t.departamento].total++;
        if (completedIds.has(t.id)) deptMap[t.departamento].completed++;
      });

      setDeptProgress(
        Object.entries(deptMap).map(([dept, v]) => ({
          departamento: dept,
          ...v,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando dashboard...</div>;

  const kpiCards = [
    {
      title: "Checklists hoy",
      value: checklistDone,
      subtitle: `de ${checklistTotal} tareas`,
      icon: CheckSquare,
      colorVar: "--card1-color",
      fallback: "hsl(var(--primary))",
      onClick: () => navigate("/checklists"),
    },
    {
      title: "Abiertas",
      value: stats.abiertas,
      subtitle: "incidencias",
      icon: AlertTriangle,
      colorVar: "--card2-color",
      fallback: "hsl(var(--warning))",
      onClick: () => navigate("/incidencias"),
    },
    {
      title: "Alertas",
      value: stats.alertas,
      subtitle: "pendientes",
      icon: Bell,
      colorVar: "--card3-color",
      fallback: "hsl(var(--success))",
      onClick: () => navigate("/alarmas"),
    },
  ];

  if (isSuperAdmin) {
    kpiCards.push({
      title: "Equipo",
      value: stats.equipo,
      subtitle: "activos",
      icon: Users,
      colorVar: "--card4-color",
      fallback: "hsl(var(--muted-foreground))",
      onClick: () => navigate("/equipo"),
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Panel</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => navigate("/alarmas")}>
            <Bell className="w-4 h-4 mr-1" /> Nueva alerta
          </Button>
          <Button size="sm" onClick={() => navigate("/incidencias")}>
            + Nueva incidencia
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:scale-[1.02] transition-transform border-0 overflow-hidden"
            style={{ backgroundColor: `var(${card.colorVar}, ${card.fallback})` }}
            onClick={card.onClick}
          >
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between min-h-[120px] text-white relative">
              <div className="flex items-center justify-between">
                <card.icon className="w-6 h-6 opacity-80" />
                <ArrowRight className="w-4 h-4 opacity-60" />
              </div>
              <div className="mt-auto">
                <p className="text-2xl sm:text-3xl font-bold">{card.value}</p>
                <p className="text-sm font-medium opacity-90">{card.title}</p>
                <p className="text-xs opacity-70">{card.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist por departamento */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Checklist realizado
        </h2>
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 space-y-4">
            {deptProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay tareas configuradas</p>
            ) : (
              deptProgress.map((dept) => {
                const pct = dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0;
                return (
                  <div
                    key={dept.departamento}
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => navigate("/checklists")}
                  >
                    <span className="text-sm font-medium min-w-[110px]">
                      {DEPT_LABELS[dept.departamento] || dept.departamento}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[32px] text-right">{pct}%</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {pct === 100 ? "Completo" : "Pendiente"}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
