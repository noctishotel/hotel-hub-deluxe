import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Hotel, Edit } from "lucide-react";

interface HotelItem {
  id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
}

export default function HotelesPage() {
  const { usuario } = useAuth();
  const [hoteles, setHoteles] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const isSuperAdmin = usuario?.rol === "super_admin";

  useEffect(() => {
    loadHoteles();
  }, []);

  const loadHoteles = async () => {
    try {
      const { data } = await supabase.from("hoteles").select("*").order("nombre");
      setHoteles(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createHotel = async () => {
    if (!newNombre.trim()) return;
    try {
      await supabase.from("hoteles").insert({ nombre: newNombre });
      toast.success("Nuevo hotel creado");
      setShowNew(false);
      setNewNombre("");
      loadHoteles();
    } catch (err) {
      toast.error("Error");
    }
  };

  const toggleActive = async (hotel: HotelItem) => {
    await supabase.from("hoteles").update({ activo: !hotel.activo }).eq("id", hotel.id);
    loadHoteles();
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hoteles</h1>
        {isSuperAdmin && (
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo hotel</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo hotel</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nombre del hotel" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} />
                <Button onClick={createHotel} className="w-full">Crear</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {hoteles.map((hotel) => (
          <Card key={hotel.id} className={`bg-card/60 backdrop-blur-sm border-border/50 ${!hotel.activo ? "opacity-50" : ""}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hotel className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{hotel.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {hotel.activo ? "Activo" : "Inactivo"} · {new Date(hotel.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
              {isSuperAdmin && (
                <Button variant="ghost" size="sm" onClick={() => toggleActive(hotel)}>
                  {hotel.activo ? "Desactivar" : "Activar"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
