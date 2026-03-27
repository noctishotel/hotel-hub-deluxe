import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Bell, Check, Trash2, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Alerta {
  id: string;
  mensaje: string;
  hotel_id: string;
  creado_por: string | null;
  created_at: string | null;
  fecha_alerta: string | null;
  atendida: boolean | null;
  atendida_por: string | null;
  atendida_en: string | null;
}

export default function AlarmasPage() {
  const { usuario, hotelId } = useAuth();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newMensaje, setNewMensaje] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [editAlerta, setEditAlerta] = useState<Alerta | null>(null);

  const isAdmin = usuario?.rol === "admin" || usuario?.rol === "super_admin";

  useEffect(() => {
    if (hotelId) loadAlertas();
  }, [hotelId]);

  const loadAlertas = async () => {
    try {
      const { data } = await supabase
        .from("alertas_globales")
        .select("*")
        .eq("hotel_id", hotelId!)
        .order("created_at", { ascending: false });
      setAlertas(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createAlerta = async () => {
    if (!newMensaje.trim()) return;
    try {
      await supabase.from("alertas_globales").insert({
        mensaje: newMensaje,
        hotel_id: hotelId!,
        creado_por: usuario?.id,
        fecha_alerta: newFecha || null,
      });
      toast.success("Crear alerta");
      setShowNew(false);
      setNewMensaje("");
      setNewFecha("");
      loadAlertas();
    } catch (err) {
      toast.error("Error");
    }
  };

  const markAtendida = async (id: string) => {
    try {
      await supabase.from("alertas_globales").update({
        atendida: true,
        atendida_por: usuario?.id,
        atendida_en: new Date().toISOString(),
      }).eq("id", id);
      loadAlertas();
    } catch (err) {
      toast.error("Error");
    }
  };

  const deleteAlerta = async (id: string) => {
    try {
      await supabase.from("alertas_globales").delete().eq("id", id);
      loadAlertas();
    } catch (err) {
      toast.error("Error");
    }
  };

  const updateAlerta = async () => {
    if (!editAlerta) return;
    try {
      await supabase.from("alertas_globales").update({
        mensaje: editAlerta.mensaje,
        fecha_alerta: editAlerta.fecha_alerta,
      }).eq("id", editAlerta.id);
      toast.success("Alerta actualizada");
      setEditAlerta(null);
      loadAlertas();
    } catch (err) {
      toast.error("Error");
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Alarmas</h1>
        {isAdmin && (
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva Alerta Global</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear alerta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Mensaje de la alerta...</Label>
                  <Textarea value={newMensaje} onChange={(e) => setNewMensaje(e.target.value)} placeholder="Describe la alerta..." />
                </div>
                <div className="space-y-1">
                  <Label>Fecha y hora (opcional)</Label>
                  <Input type="datetime-local" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} />
                </div>
                <Button onClick={createAlerta} className="w-full">Programar alerta</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editAlerta} onOpenChange={(open) => !open && setEditAlerta(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Alerta</DialogTitle></DialogHeader>
          {editAlerta && (
            <div className="space-y-3">
              <Textarea value={editAlerta.mensaje} onChange={(e) => setEditAlerta({ ...editAlerta, mensaje: e.target.value })} />
              <Input type="datetime-local" value={editAlerta.fecha_alerta ?? ""} onChange={(e) => setEditAlerta({ ...editAlerta, fecha_alerta: e.target.value })} />
              <Button onClick={updateAlerta} className="w-full">Guardar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {alertas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Sin alertas globales</div>
      ) : (
        <div className="space-y-2">
          {alertas.map((alerta) => (
            <Card key={alerta.id} className={`bg-card/60 backdrop-blur-sm border-border/50 ${alerta.atendida ? "opacity-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-4 h-4 text-warning shrink-0" />
                      <p className="text-sm font-medium">{alerta.mensaje}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {alerta.fecha_alerta && (
                        <Badge variant="outline" className="text-[10px]">
                          {new Date(alerta.fecha_alerta).toLocaleString("es-ES")}
                        </Badge>
                      )}
                      {alerta.atendida && <Badge variant="secondary" className="text-[10px]">Atendida</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!alerta.atendida && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => markAtendida(alerta.id)}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Marcar atendida
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditAlerta(alerta)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAlerta(alerta.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
