import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Plus, Trash2 } from "lucide-react";

interface AgendaItem {
  id: string;
  fecha: string;
  nota: string | null;
  usuario_id: string;
  hotel_id: string;
  alerta_fecha: string | null;
  alerta_mensaje: string | null;
  created_at: string;
  updated_at: string;
}

export default function AgendaPage() {
  const { usuario, hotelId } = useAuth();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState("");
  const [alertaFecha, setAlertaFecha] = useState("");
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (hotelId && usuario) loadAgenda();
  }, [hotelId, usuario]);

  const loadAgenda = async () => {
    try {
      const { data } = await supabase
        .from("agenda")
        .select("*")
        .eq("hotel_id", hotelId!)
        .eq("usuario_id", usuario!.id)
        .order("fecha", { ascending: false });
      setItems(data ?? []);

      const todayItem = data?.find((i) => i.fecha === today);
      if (todayItem) {
        setNota(todayItem.nota ?? "");
        setAlertaFecha(todayItem.alerta_fecha ?? "");
        setAlertaMensaje(todayItem.alerta_mensaje ?? "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveNota = async () => {
    try {
      const existing = items.find((i) => i.fecha === today);
      if (existing) {
        await supabase.from("agenda").update({
          nota,
          alerta_fecha: alertaFecha || null,
          alerta_mensaje: alertaMensaje || null,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("agenda").insert({
          fecha: today,
          nota,
          usuario_id: usuario!.id,
          hotel_id: hotelId!,
          alerta_fecha: alertaFecha || null,
          alerta_mensaje: alertaMensaje || null,
        });
      }
      toast.success("Guardado");
      loadAgenda();
    } catch (err) {
      toast.error("Error al guardar");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await supabase.from("agenda").delete().eq("id", id);
      loadAgenda();
    } catch (err) {
      toast.error("Error");
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="text-xl font-semibold">Agenda</h1>

      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Objetivos del día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Escribe tus objetivos para hoy..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fecha y hora</Label>
              <Input type="datetime-local" value={alertaFecha} onChange={(e) => setAlertaFecha(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nota explicativa</Label>
              <Input placeholder="Notas adicionales..." value={alertaMensaje} onChange={(e) => setAlertaMensaje(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <Button onClick={saveNota} size="sm">Guardar</Button>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Historial</h2>
          {items.filter((i) => i.fecha !== today).map((item) => (
            <Card key={item.id} className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardContent className="p-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{item.fecha}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{item.nota}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => deleteItem(item.id)}>
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
