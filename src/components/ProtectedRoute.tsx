import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "empleado" | "admin" | "super_admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const roleRank: Record<AppRole, number> = {
  empleado: 0,
  admin: 1,
  super_admin: 2,
};

const hasRequiredRole = (currentRole: AppRole | null, requiredRole?: AppRole) => {
  if (!requiredRole) return true;
  if (!currentRole) return false;
  return roleRank[currentRole] >= roleRank[requiredRole];
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { session, role, loading } = useAuth();
  useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-svh">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole(role, requiredRole)) {
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
