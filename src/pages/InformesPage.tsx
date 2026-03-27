import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Share2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL_DEPARTAMENTOS = [
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

interface IncidenciaRow {
  id: string;
  estado: string;
  departamento: string;
  prioridad: string;
  creado_en: string;
  titulo: string;
  asignado_a: string | null;
}

interface RegistroRow {
  id: string;
  tarea_id: string;
  fecha: string;
  completado_por: string | null;
  completado_a: string;
}

interface UsuarioRow {
  id: string;
  nombre: string;
  departamento: string;
}

interface TareaRow {
  id: string;
  titulo: string;
  departamento: string;
}

export default function InformesPage() {
  const { usuario, hotelId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incidencias, setIncidencias] = useState<IncidenciaRow[]>([]);
  const [registros, setRegistros] = useState<RegistroRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [tareas, setTareas] = useState<TareaRow[]>([]);
  const [periodoIncidencias, setPeriodoIncidencias] = useState("30");
  const [periodoChecklists, setPeriodoChecklists] = useState("7");

  const isSuperAdmin = usuario?.rol === "super_admin";
  const DEPARTAMENTOS = ALL_DEPARTAMENTOS.filter(d => d.value !== "administracion" || isSuperAdmin);

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId]);

  const loadData = async () => {
    try {
      const [incRes, regRes, usrRes, tarRes] = await Promise.all([
        supabase.from("incidencias").select("id, estado, departamento, prioridad, creado_en, titulo, asignado_a").eq("hotel_id", hotelId!),
        supabase.from("registros_checklist").select("id, tarea_id, fecha, completado_por, completado_a").eq("hotel_id", hotelId!),
        supabase.from("usuarios").select("id, nombre, departamento").eq("hotel_id", hotelId!).eq("activo", true),
        supabase.from("tareas").select("id, titulo, departamento").eq("hotel_id", hotelId!).eq("activo", true),
      ]);
      setIncidencias(incRes.data ?? []);
      setRegistros(regRes.data ?? []);
      setUsuarios(usrRes.data ?? []);
      setTareas(tarRes.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by period
  const filterByDays = <T extends { creado_en?: string; fecha?: string; completado_a?: string }>(data: T[], days: number, field: keyof T) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter((d) => new Date(d[field] as string) >= cutoff);
  };

  const filteredInc = filterByDays(incidencias, parseInt(periodoIncidencias), "creado_en");
  const filteredReg = filterByDays(registros, parseInt(periodoChecklists), "completado_a");

  // Incidencias stats
  const incByEstado = ["abierta", "en_proceso", "resuelta", "cerrada"].map((estado) => ({
    name: estado === "en_proceso" ? "En proceso" : estado === "cerrada" ? "Archivada" : estado.charAt(0).toUpperCase() + estado.slice(1),
    value: filteredInc.filter((i) => i.estado === estado).length,
  }));

  const incByDept = DEPARTAMENTOS.map((d) => ({
    dept: d.label,
    total: filteredInc.filter((i) => i.departamento === d.value).length,
  })).filter((d) => d.total > 0);

  const totalInc = filteredInc.length;
  const resueltas = filteredInc.filter((i) => i.estado === "resuelta" || i.estado === "cerrada").length;
  const tasaResolucion = totalInc > 0 ? Math.round((resueltas / totalInc) * 100) : 0;

  // Checklist stats
  const checkByDept = DEPARTAMENTOS.map((d) => {
    const deptTareas = tareas.filter(t => t.departamento === d.value);
    const deptRegistros = filteredReg.filter(r => deptTareas.some(t => t.id === r.tarea_id));
    return { dept: d.label, completadas: deptRegistros.length };
  }).filter(d => d.completadas > 0);

  // Employee performance (super_admin only)
  const empleadoPerformance = usuarios.map((u) => {
    const tareasCompletadas = filteredReg.filter(r => r.completado_por === u.id).length;
    const incCreadas = filteredInc.filter(i => i.asignado_a === u.id).length;
    const incResueltas = filteredInc.filter(i => i.asignado_a === u.id && (i.estado === "resuelta" || i.estado === "cerrada")).length;
    return {
      nombre: u.nombre,
      dept: DEPARTAMENTOS.find(d => d.value === u.departamento)?.label ?? u.departamento,
      tareasCompletadas,
      incCreadas,
      incResueltas,
    };
  }).filter(e => e.tareasCompletadas > 0 || e.incCreadas > 0);

  // Export functions
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) { toast.error("Sin datos para exportar"); return; }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado");
  };

  const exportIncidenciasCSV = () => {
    const data = filteredInc.map(i => ({
      Titulo: i.titulo,
      Estado: i.estado,
      Prioridad: i.prioridad,
      Departamento: DEPARTAMENTOS.find(d => d.value === i.departamento)?.label ?? i.departamento,
      Asignado: usuarios.find(u => u.id === i.asignado_a)?.nombre ?? "Sin asignar",
      Fecha: new Date(i.creado_en).toLocaleDateString("es"),
    }));
    exportCSV(data, "incidencias");
  };

  const exportChecklistsCSV = () => {
    const data = filteredReg.map(r => {
      const tarea = tareas.find(t => t.id === r.tarea_id);
      const usr = usuarios.find(u => u.id === r.completado_por);
      return {
        Tarea: tarea?.titulo ?? "—",
        Departamento: DEPARTAMENTOS.find(d => d.value === tarea?.departamento)?.label ?? "—",
        CompletadoPor: usr?.nombre ?? "—",
        Fecha: r.fecha,
        Hora: new Date(r.completado_a).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      };
    });
    exportCSV(data, "checklists-completados");
  };

  const shareWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareIncidenciasWA = () => {
    let text = `INFORME INCIDENCIAS\n${new Date().toLocaleDateString("es")}\n\nTotal: ${totalInc} | Resueltas: ${resueltas} (${tasaResolucion}%)\n\n`;
    filteredInc.slice(0, 20).forEach(i => {
      const dept = DEPARTAMENTOS.find(d => d.value === i.departamento)?.label ?? "";
      const asig = usuarios.find(u => u.id === i.asignado_a)?.nombre ?? "Sin asignar";
      text += `- ${i.titulo} [${i.estado.toUpperCase()}] ${dept} | ${asig}\n`;
    });
    if (filteredInc.length > 20) text += `\n... y ${filteredInc.length - 20} mas`;
    shareWhatsApp(text);
  };

  const shareChecklistsWA = () => {
    let text = `RESUMEN CHECKLISTS\n${new Date().toLocaleDateString("es")}\n\nTareas completadas: ${filteredReg.length}\n\n`;
    checkByDept.forEach(d => {
      text += `${d.dept}: ${d.completadas} completadas\n`;
    });
    shareWhatsApp(text);
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando informes...</div>;

  return (
    <div className="p-3 md:p-6 space-y-4 animate-fade-in">
      <h1 className="text-lg font-semibold">Informes</h1>

      <Tabs defaultValue="incidencias" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="incidencias" className="text-xs">Incidencias</TabsTrigger>
          <TabsTrigger value="checklists" className="text-xs">Checklists</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="desempeno" className="text-xs">Desempeño</TabsTrigger>}
        </TabsList>

        {/* INCIDENCIAS TAB */}
        <TabsContent value="incidencias" className="space-y-3 mt-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Select value={periodoIncidencias} onValueChange={setPeriodoIncidencias}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportIncidenciasCSV}>
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={shareIncidenciasWA}>
                <Share2 className="w-3 h-3 mr-1" /> WhatsApp
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-[11px] text-muted-foreground">Total</CardTitle></CardHeader>
              <CardContent className="px-3 pb-3"><div className="text-xl font-bold">{totalInc}</div></CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-[11px] text-muted-foreground">Resolución</CardTitle></CardHeader>
              <CardContent className="px-3 pb-3"><div className="text-xl font-bold">{tasaResolucion}%</div></CardContent>
            </Card>
          </div>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs">Por estado</CardTitle></CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={incByEstado.filter(e => e.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                    {incByEstado.map((_, i) => <Cell key={i} fill={Object.values(ESTADO_COLORS)[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs">Por departamento</CardTitle></CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={incByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHECKLISTS TAB */}
        <TabsContent value="checklists" className="space-y-3 mt-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Select value={periodoChecklists} onValueChange={setPeriodoChecklists}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoy</SelectItem>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportChecklistsCSV}>
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={shareChecklistsWA}>
                <Share2 className="w-3 h-3 mr-1" /> WhatsApp
              </Button>
            </div>
          </div>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-[11px] text-muted-foreground">Tareas completadas</CardTitle></CardHeader>
            <CardContent className="px-3 pb-3"><div className="text-xl font-bold">{filteredReg.length}</div></CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs">Completadas por departamento</CardTitle></CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={checkByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="completadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed list */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs">Detalle</CardTitle></CardHeader>
            <CardContent className="px-3 pb-3 max-h-60 overflow-y-auto">
              {filteredReg.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin registros en este periodo</p>
              ) : (
                <div className="space-y-1">
                  {filteredReg.slice(0, 50).map((r) => {
                    const tarea = tareas.find(t => t.id === r.tarea_id);
                    const usr = usuarios.find(u => u.id === r.completado_por);
                    return (
                      <div key={r.id} className="flex items-center justify-between text-[11px] py-1 border-b border-border/30 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{tarea?.titulo ?? "—"}</p>
                          <p className="text-muted-foreground">{usr?.nombre ?? "—"}</p>
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2">{r.fecha}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESEMPEÑO TAB (super_admin only) */}
        {isSuperAdmin && (
          <TabsContent value="desempeno" className="space-y-3 mt-3">
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs">Desempeño por empleado</CardTitle></CardHeader>
              <CardContent className="px-3 pb-3">
                {empleadoPerformance.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sin actividad en este periodo</p>
                ) : (
                  <div className="space-y-2">
                    {empleadoPerformance.sort((a, b) => b.tareasCompletadas - a.tareasCompletadas).map((e, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{e.nombre}</p>
                          <p className="text-[11px] text-muted-foreground">{e.dept}</p>
                        </div>
                        <div className="flex gap-3 text-right">
                          <div>
                            <p className="text-sm font-bold">{e.tareasCompletadas}</p>
                            <p className="text-[10px] text-muted-foreground">Tareas</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold">{e.incResueltas}/{e.incCreadas}</p>
                            <p className="text-[10px] text-muted-foreground">Inc. resueltas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
