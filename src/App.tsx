import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PanelPage from "@/pages/PanelPage";
import ChecklistsPage from "@/pages/ChecklistsPage";
import IncidenciasPage from "@/pages/IncidenciasPage";
import AlarmasPage from "@/pages/AlarmasPage";
import EquipoPage from "@/pages/EquipoPage";
import InformesPage from "@/pages/InformesPage";
import AgendaPage from "@/pages/AgendaPage";
import AdminPage from "@/pages/AdminPage";
import HotelesPage from "@/pages/HotelesPage";
import HistorialChecklistsPage from "@/pages/HistorialChecklistsPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Navigate to="/panel" replace />} />
            <Route path="/panel" element={<ProtectedRoute><AppLayout><PanelPage /></AppLayout></ProtectedRoute>} />
            <Route path="/checklists" element={<ProtectedRoute><AppLayout><ChecklistsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/incidencias" element={<ProtectedRoute><AppLayout><IncidenciasPage /></AppLayout></ProtectedRoute>} />
            <Route path="/alarmas" element={<ProtectedRoute><AppLayout><AlarmasPage /></AppLayout></ProtectedRoute>} />
            <Route path="/equipo" element={<ProtectedRoute superOnly><AppLayout><EquipoPage /></AppLayout></ProtectedRoute>} />
            <Route path="/informes" element={<ProtectedRoute adminOnly><AppLayout><InformesPage /></AppLayout></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><AppLayout><AgendaPage /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute superOnly><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />
            <Route path="/administracion" element={<ProtectedRoute superOnly><Navigate to="/admin" replace /></ProtectedRoute>} />
            <Route path="/hoteles" element={<ProtectedRoute superOnly><AppLayout><HotelesPage /></AppLayout></ProtectedRoute>} />
            <Route path="/historial-checklists" element={<ProtectedRoute superOnly><AppLayout><HistorialChecklistsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/historial" element={<ProtectedRoute superOnly><Navigate to="/historial-checklists" replace /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
