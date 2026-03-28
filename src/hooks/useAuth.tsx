import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AppRole = "empleado" | "admin" | "super_admin";
type Departamento = "recepcion" | "limpieza" | "fyb" | "mantenimiento" | "administracion" | "direccion";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: AppRole;
  departamento: Departamento;
  hotel_id: string;
  activo: boolean;
  auth_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  usuario: Usuario | null;
  role: AppRole | null;
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

  // Try to restore cached profile for instant render
  const cachedProfile = (() => {
    try {
      const raw = sessionStorage.getItem("noctis_user_profile");
      return raw ? JSON.parse(raw) as Usuario : null;
    } catch { return null; }
  })();

  const [usuario, setUsuarioState] = useState<Usuario | null>(cachedProfile);
  const [role, setRole] = useState<AppRole | null>(cachedProfile?.rol ?? null);
  const [loading, setLoading] = useState(!cachedProfile);
  const activeRequestRef = useRef(0);

  const setUsuario = useCallback((u: Usuario | null) => {
    setUsuarioState(u);
    try {
      if (u) sessionStorage.setItem("noctis_user_profile", JSON.stringify(u));
      else sessionStorage.removeItem("noctis_user_profile");
    } catch {}
  }, []);

  const resetAuthState = useCallback(() => {
    setUsuario(null);
    setRole(null);
  }, []);

  const fetchCurrentUserProfile = useCallback(async (authId: string) => {
    const requestId = ++activeRequestRef.current;
    setLoading(true);

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

      if (requestId !== activeRequestRef.current) return;

      const nextUsuario = (data as Usuario | null) ?? null;
      setUsuario(nextUsuario);
      setRole(nextUsuario?.rol ?? null);
    } catch (err) {
      console.error("Error fetching usuario:", err);

      if (requestId !== activeRequestRef.current) return;

      resetAuthState();
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [resetAuthState]);

  const syncAuthState = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user?.id) {
      activeRequestRef.current += 1;
      resetAuthState();
      setLoading(false);
      return;
    }

    await fetchCurrentUserProfile(nextSession.user.id);
  }, [fetchCurrentUserProfile, resetAuthState]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncAuthState(initialSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [syncAuthState]);

  const signOut = useCallback(async () => {
    activeRequestRef.current += 1;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    resetAuthState();
    setLoading(false);
    try { sessionStorage.removeItem("noctis_user_profile"); sessionStorage.removeItem("noctis_theme_cache"); } catch {}
  }, [resetAuthState]);

  const value = useMemo(() => ({
    session,
    user,
    usuario,
    role,
    loading,
    hotelId: usuario?.hotel_id ?? null,
    signOut,
  }), [loading, role, session, signOut, user, usuario]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
