import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Settings, Palette, Type } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DEPARTAMENTOS = [
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "fyb", label: "F&B" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" },
  { value: "direccion", label: "Dirección" },
];

interface Categoria {
  id: string;
  nombre: string;
  departamento: string;
  hotel_id: string;
  orden: number;
  color: string | null;
  activo: boolean;
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  departamento: string;
  categoria_id: string | null;
  orden: number;
  activo: boolean;
  hotel_id: string;
  tipo: string;
  color: string | null;
}

interface ConfigItem {
  clave: string;
  valor: string | null;
}

export default function AdminPage() {
  const { hotelId } = useAuth();
  const [activeTab, setActiveTab] = useState("plantillas");

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-semibold">Administración</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plantillas"><Settings className="w-3.5 h-3.5 mr-1" /> Plantillas</TabsTrigger>
          <TabsTrigger value="tema"><Palette className="w-3.5 h-3.5 mr-1" /> Tema</TabsTrigger>
        </TabsList>
        <TabsContent value="plantillas"><PlantillasTab /></TabsContent>
        <TabsContent value="tema"><TemaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PlantillasTab() {
  const { hotelId } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [selectedDept, setSelectedDept] = useState("recepcion");
  const [loading, setLoading] = useState(true);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingToCat, setAddingToCat] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    if (hotelId) loadData();
  }, [hotelId, selectedDept]);

  const loadData = async () => {
    try {
      const [catRes, taskRes] = await Promise.all([
        supabase.from("categorias_checklist").select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("activo", true).order("orden"),
        supabase.from("tareas").select("*").eq("hotel_id", hotelId!).eq("departamento", selectedDept as any).eq("activo", true).order("orden"),
      ]);
      setCategorias(catRes.data ?? []);
      setTareas(taskRes.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await supabase.from("categorias_checklist").insert({
        nombre: newCatName,
        departamento: selectedDept as any,
        hotel_id: hotelId!,
        orden: categorias.length,
      });
      toast.success("Categoría creada");
      setNewCatName("");
      setShowNewCat(false);
      loadData();
    } catch (err) {
      toast.error("Error");
    }
  };

  const addTask = async (categoriaId: string | null) => {
    if (!newTaskTitle.trim()) return;
    try {
      await supabase.from("tareas").insert({
        titulo: newTaskTitle,
        departamento: selectedDept as any,
        hotel_id: hotelId!,
        categoria_id: categoriaId,
        orden: tareas.length,
      });
      setNewTaskTitle("");
      setAddingToCat(null);
      loadData();
    } catch (err) {
      toast.error("Error");
    }
  };

  const bulkAdd = async (categoriaId: string | null) => {
    const lines = bulkText.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return;
    try {
      const inserts = lines.map((line, i) => ({
        titulo: line.trim(),
        departamento: selectedDept as any,
        hotel_id: hotelId!,
        categoria_id: categoriaId,
        orden: tareas.length + i,
      }));
      await supabase.from("tareas").insert(inserts);
      setBulkText("");
      setShowBulk(false);
      loadData();
    } catch (err) {
      toast.error("Error");
    }
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tareas").update({ activo: false }).eq("id", id);
    loadData();
  };

  const deleteCategory = async (id: string, deleteTasks: boolean) => {
    if (deleteTasks) {
      await supabase.from("tareas").update({ activo: false }).eq("categoria_id", id);
      toast.success("Categoría y tareas eliminadas");
    } else {
      await supabase.from("tareas").update({ categoria_id: null }).eq("categoria_id", id);
      toast.success("Categoría eliminada");
    }
    await supabase.from("categorias_checklist").update({ activo: false }).eq("id", id);
    loadData();
  };

  const tareasForCat = (catId: string) => tareas.filter((t) => t.categoria_id === catId);
  const tareasWithoutCat = tareas.filter((t) => !t.categoria_id);

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={selectedDept} onValueChange={setSelectedDept}>
        <TabsList className="flex-wrap">
          {DEPARTAMENTOS.map((d) => (
            <TabsTrigger key={d.value} value={d.value} className="text-xs">{d.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <Dialog open={showNewCat} onOpenChange={setShowNewCat}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Nueva categoría</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Ej: Turno mañana, Tareas semanales..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
              <Button onClick={createCategory} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulk} onOpenChange={setShowBulk}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Crear checklist rápido</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear checklist rápido</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Pega tu lista desde Notion, Word o cualquier editor. Una tarea por línea.</p>
              <Textarea rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Lista de tareas" />
              <Button onClick={() => bulkAdd(null)} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {categorias.length === 0 && tareasWithoutCat.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay categorías creadas. Crea una para organizar tus checklists por turnos o periodos.
        </div>
      ) : (
        <div className="space-y-3">
          {categorias.map((cat) => (
            <Card key={cat.id} className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {cat.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />}
                  {cat.nombre}
                </CardTitle>
                <div className="flex gap-1">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                        <AlertDialogDescription>¿Eliminar esta categoría Y todas sus tareas? Esta acción no se puede deshacer.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button variant="outline" onClick={() => deleteCategory(cat.id, false)}>Eliminar categoría (mantener tareas)</Button>
                        <AlertDialogAction onClick={() => deleteCategory(cat.id, true)}>Eliminar categoría y todas sus tareas</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {tareasForCat(cat.id).map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                    <span className="text-sm flex-1">{tarea.titulo}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive/60" onClick={() => deleteTask(tarea.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="pt-1">
                  <Input
                    placeholder="Nueva tarea..."
                    className="h-8 text-sm"
                    value={addingToCat === cat.id ? newTaskTitle : ""}
                    onFocus={() => setAddingToCat(cat.id)}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask(cat.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {tareasWithoutCat.length > 0 && (
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-muted-foreground">Sin categoría</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {tareasWithoutCat.map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between py-1.5 px-2">
                    <span className="text-sm">{tarea.titulo}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive/60" onClick={() => deleteTask(tarea.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function TemaTab() {
  const { hotelId } = useAuth();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hotelId) loadConfig();
  }, [hotelId]);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("configuracion")
      .select("clave, valor")
      .eq("hotel_id", hotelId!);
    const c: Record<string, string> = {};
    (data ?? []).forEach((item) => {
      if (item.valor) c[item.clave] = item.valor;
    });
    setConfig(c);
  };

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(config);
      for (const [clave, valor] of entries) {
        await supabase.from("configuracion").upsert(
          { clave, valor, hotel_id: hotelId! },
          { onConflict: "hotel_id,clave" }
        );
      }
      applyTheme(config);
      toast.success("Tema guardado");
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof PALETTE_PRESETS[0]) => {
    const merged = { ...config, ...preset.values };
    setConfig(merged);
    applyTheme(merged);
    toast.success(`Paleta "${preset.name}" aplicada`);
  };

  const resetTheme = () => {
    setConfig({ ...DEFAULT_THEME });
    applyTheme(DEFAULT_THEME);
    toast.success("Valores por defecto restaurados");
  };

  // Group color fields
  const groups = COLOR_FIELDS.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {} as Record<string, typeof COLOR_FIELDS>);

  return (
    <div className="space-y-4 mt-4">
      {/* Palette presets */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Paletas predefinidas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PALETTE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="text-left p-3 rounded-lg border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex gap-1 mb-2">
                  {preset.preview.map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p className="text-[13px] font-medium">{preset.name}</p>
                <p className="text-[11px] text-muted-foreground">{preset.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color fields by group */}
      {Object.entries(groups).map(([groupName, fields]) => (
        <Card key={groupName} className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader><CardTitle className="text-sm">{groupName}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="flex gap-3 items-center">
                <input
                  type="color"
                  value={config[field.key] || DEFAULT_THEME[field.key] || "#000000"}
                  onChange={(e) => updateConfig(field.key, e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{field.label}</p>
                  <p className="text-[11px] text-muted-foreground">{field.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Typography */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Type className="w-4 h-4" /> Tipografía</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-[13px] font-medium">Fuente de títulos</Label>
            <Input value={config.heading_font || ""} onChange={(e) => updateConfig("heading_font", e.target.value)} className="h-10" placeholder="Inter" />
          </div>
          <div>
            <Label className="text-[13px] font-medium">Fuente del cuerpo</Label>
            <Input value={config.body_font || ""} onChange={(e) => updateConfig("body_font", e.target.value)} className="h-10" placeholder="Inter" />
          </div>
          <div>
            <Label className="text-[13px] font-medium">Tamaño de texto</Label>
            <div className="flex items-center gap-3">
              <input type="range" min="12" max="22" value={config.font_size || "16"} onChange={(e) => updateConfig("font_size", e.target.value)} className="flex-1 accent-primary" />
              <span className="text-[11px] text-muted-foreground w-12 tabular-nums">{config.font_size || 16}px</span>
            </div>
          </div>
          <div>
            <Label className="text-[13px] font-medium">Radio de bordes</Label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="20" value={config.border_radius || "10"} onChange={(e) => updateConfig("border_radius", e.target.value)} className="flex-1 accent-primary" />
              <span className="text-[11px] text-muted-foreground w-12 tabular-nums">{config.border_radius || 10}px</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={saveTheme} disabled={saving} className="flex-1 h-10">
          {saving ? "Guardando..." : "Guardar tema"}
        </Button>
        <Button variant="outline" className="h-10 gap-1.5" onClick={resetTheme}>
          Reset
        </Button>
      </div>
    </div>
  );
}
