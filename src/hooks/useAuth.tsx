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
  refreshUsuario: (authId?: string) => Promise<Usuario | null>;
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

  const fetchUsuario = async (authId: string, options?: { silent?: boolean }) => {
    const currentFetchId = ++lastFetchId.current;

    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, email, rol, departamento, hotel_id, activo, auth_id")
        .eq("auth_id", authId)
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (currentFetchId !== lastFetchId.current) return null;

      const nextUsuario = data as Usuario | null;
      setUsuario(nextUsuario);
      return nextUsuario;
    } catch (err) {
      console.error("Error fetching usuario:", err);

      if (currentFetchId !== lastFetchId.current) return null;

      setUsuario(null);
      return null;
    } finally {
      if (!options?.silent && currentFetchId === lastFetchId.current) {
        setLoading(false);
      }
    }
  };

  const refreshUsuario = async (authId?: string) => {
    const targetAuthId = authId ?? session?.user?.id ?? null;

    if (!targetAuthId) {
      setUsuario(null);
      return null;
    }

    return fetchUsuario(targetAuthId, { silent: true });
  };

  const signOut = async () => {
    lastFetchId.current += 1;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, usuario, loading, hotelId: usuario?.hotel_id ?? null, signOut, refreshUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};
