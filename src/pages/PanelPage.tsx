import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle, ListChecks } from "lucide-react";

export default function PanelPage() {
  const { hotelId } = useAuth();
  const [stats, setStats] = useState({ total: 0, abiertas: 0, enProceso: 0, resueltas: 0 });
  const [checklistStats, setChecklistStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    loadStats();
  }, [hotelId]);

  const loadStats = async () => {
    try {
      const { data: incidencias } = await supabase
        .from("incidencias")
        .select("estado")
        .eq("hotel_id", hotelId!);

      if (incidencias) {
        setStats({
          total: incidencias.length,
          abiertas: incidencias.filter((i) => i.estado === "abierta").length,
          enProceso: incidencias.filter((i) => i.estado === "en_proceso").length,
          resueltas: incidencias.filter((i) => i.estado === "resuelta").length,
        });
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: tareas } = await supabase
        .from("tareas")
        .select("id")
        .eq("hotel_id", hotelId!)
        .eq("activo", true);

      const { data: registros } = await supabase
        .from("registros_checklist")
        .select("tarea_id")
        .eq("hotel_id", hotelId!)
        .eq("fecha", today);

      setChecklistStats({
        total: tareas?.length ?? 0,
        completed: registros?.length ?? 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando dashboard...</div>;
  }

  const cards = [
    { title: "Total incidencias", value: stats.total, icon: AlertTriangle, color: "hsl(0, 72%, 51%)" },
    { title: "Abiertas", value: stats.abiertas, icon: Clock, color: "hsl(38, 92%, 50%)" },
    { title: "En proceso", value: stats.enProceso, icon: ListChecks, color: "hsl(217, 91%, 60%)" },
    { title: "Resueltas", value: stats.resueltas, icon: CheckCircle, color: "hsl(142, 52%, 36%)" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="text-xl font-semibold">Panel</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Checklists hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">
              {checklistStats.completed}/{checklistStats.total}
            </div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: checklistStats.total > 0
                    ? `${(checklistStats.completed / checklistStats.total) * 100}%`
                    : "0%",
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {checklistStats.total > 0
                ? Math.round((checklistStats.completed / checklistStats.total) * 100)
                : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
