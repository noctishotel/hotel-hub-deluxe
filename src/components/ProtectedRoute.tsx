import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly }: ProtectedRouteProps) => {
  const { session, usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-svh">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!session || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && usuario.rol === "empleado") {
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
