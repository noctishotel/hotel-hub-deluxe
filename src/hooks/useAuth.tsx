import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "empleado" | "admin" | "super_admin";
  departamento: "recepcion" | "limpieza" | "fyb" | "mantenimiento" | "administracion" | "direccion";
  hotel_id: string;
  activo: boolean;
  auth_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  usuario: Usuario | null;
  loading: boolean;
  hotelId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchId = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setUsuario(null);
      if (s?.user) {
        setLoading(true);
        fetchUsuario(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setUsuario(null);
      if (s?.user) {
        setLoading(true);
        fetchUsuario(s.user.id);
      }
      else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsuario = async (authId: string) => {
    const currentFetchId = ++lastFetchId.current;

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", authId)
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (currentFetchId !== lastFetchId.current) return;

      setUsuario(data as Usuario | null);
    } catch (err) {
      console.error("Error fetching usuario:", err);

      if (currentFetchId !== lastFetchId.current) return;

      setUsuario(null);
    } finally {
      if (currentFetchId === lastFetchId.current) {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    lastFetchId.current += 1;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, usuario, loading, hotelId: usuario?.hotel_id ?? null, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
