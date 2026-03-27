import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

const ESTADO_COLORS: Record<string, string> = {
  abierta: "#ef4444",
  en_proceso: "#f59e0b",
  resuelta: "#10b981",
  cerrada: "#6b7280",
};

export default function InformesPage() {
  const { hotelId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incidenciasByEstado, setIncidenciasByEstado] = useState<{ name: string; value: number }[]>([]);
  const [incidenciasByDept, setIncidenciasByDept] = useState<{ dept: string; total: number }[]>([]);
  const [totalIncidencias, setTotalIncidencias] = useState(0);
  const [tasaResolucion, setTasaResolucion] = useState(0);

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId]);

  const loadData = async () => {
    try {
      const { data } = await supabase
        .from("incidencias")
        .select("estado, departamento")
        .eq("hotel_id", hotelId!);

      if (data) {
        setTotalIncidencias(data.length);

        const byEstado = ["abierta", "en_proceso", "resuelta", "cerrada"].map((estado) => ({
          name: estado === "en_proceso" ? "En proceso" : estado.charAt(0).toUpperCase() + estado.slice(1),
          value: data.filter((i) => i.estado === estado).length,
        }));
        setIncidenciasByEstado(byEstado);

        const byDept = DEPARTAMENTOS.map((d) => ({
          dept: d.label,
          total: data.filter((i) => i.departamento === d.value).length,
        })).filter((d) => d.total > 0);
        setIncidenciasByDept(byDept);

        const resueltas = data.filter((i) => i.estado === "resuelta" || i.estado === "cerrada").length;
        setTasaResolucion(data.length > 0 ? Math.round((resueltas / data.length) * 100) : 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando informes...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="text-xl font-semibold">Informes</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total incidencias</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalIncidencias}</div></CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tasa resolución</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{tasaResolucion}%</div></CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader><CardTitle className="text-sm">Incidencias por estado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={incidenciasByEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {incidenciasByEstado.map((entry, i) => (
                  <Cell key={i} fill={Object.values(ESTADO_COLORS)[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader><CardTitle className="text-sm">Tareas por departamento</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incidenciasByDept}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="hsl(220, 14%, 20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
