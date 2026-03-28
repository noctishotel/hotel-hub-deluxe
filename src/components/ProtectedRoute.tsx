import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly, superOnly }: ProtectedRouteProps) => {
  const { session, usuario, loading, refreshUsuario } = useAuth();
  const location = useLocation();
  const requiresRoleVerification = Boolean(superOnly || adminOnly);
  const [routeChecking, setRouteChecking] = useState<boolean>(requiresRoleVerification);
  const [verifiedRole, setVerifiedRole] = useState<string | null>(requiresRoleVerification ? null : usuario?.rol ?? null);

  useEffect(() => {
    let alive = true;

    const verifyRole = async () => {
      if (!session?.user?.id) {
        if (!alive) return;
        setVerifiedRole(null);
        setRouteChecking(false);
        return;
      }

      if (!requiresRoleVerification) {
        if (!alive) return;
        setVerifiedRole(usuario?.rol ?? null);
        setRouteChecking(false);
        return;
      }

      setRouteChecking(true);
      const nextUsuario = await refreshUsuario(session.user.id);

      if (!alive) return;

      setVerifiedRole(nextUsuario?.rol ?? null);
      setRouteChecking(false);
    };

    void verifyRole();

    return () => {
      alive = false;
    };
  }, [location.pathname, session?.user?.id, requiresRoleVerification, usuario?.rol, refreshUsuario]);

  if (loading || routeChecking) {
    return (
      <div className="flex items-center justify-center h-svh">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!session || !usuario) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRole = verifiedRole ?? usuario.rol;

  if (superOnly && effectiveRole !== "super_admin") {
    return <Navigate to="/panel" replace />;
  }

  if (adminOnly && effectiveRole === "empleado") {
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
