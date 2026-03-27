import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Bell,
  Users,
  BarChart3,
  Calendar,
  Settings,
  Hotel,
  History,
  LogOut,
} from "lucide-react";

const mainNav = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/checklists", label: "Checklists", icon: ClipboardList },
  { to: "/incidencias", label: "Incidencias", icon: AlertTriangle },
  { to: "/alarmas", label: "Alarmas", icon: Bell },
  { to: "/agenda", label: "Agenda", icon: Calendar },
];

const adminNav: { to: string; label: string; icon: any; superOnly?: boolean }[] = [
  { to: "/equipo", label: "Equipo", icon: Users, superOnly: true },
  { to: "/informes", label: "Informes", icon: BarChart3 },
  { to: "/admin", label: "Administración", icon: Settings, superOnly: true },
  { to: "/hoteles", label: "Hoteles", icon: Hotel, superOnly: true },
  { to: "/historial-checklists", label: "Historial", icon: History },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, signOut, loading } = useAuth();
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = !loading && (usuario?.rol === "admin" || usuario?.rol === "super_admin");
  const isSuperAdmin = !loading && usuario?.rol === "super_admin";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-sidebar-foreground" style={{ fontSize: "var(--sidebar-brand-size)" }}>
                Noctis Hub
              </span>
            </div>
            <p className="text-xs text-sidebar-foreground/60">Gestión Hotelera</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel style={{ fontSize: "var(--sidebar-group-size)" }}>
                Navegación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNav.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.to)}
                        isActive={location.pathname === item.to}
                        style={{ fontSize: "var(--sidebar-item-size)" }}
                        className={location.pathname === item.to ? "bg-[hsl(var(--tab-active-bg))] text-[hsl(var(--tab-active-fg))]" : ""}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel style={{ fontSize: "var(--sidebar-group-size)" }}>
                  Gestión
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNav.filter((item) => !item.superOnly || isSuperAdmin).map((item) => (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.to)}
                          isActive={location.pathname === item.to}
                          style={{ fontSize: "var(--sidebar-item-size)" }}
                          className={location.pathname === item.to ? "bg-[hsl(var(--tab-active-bg))] text-[hsl(var(--tab-active-fg))]" : ""}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="p-4 space-y-2">
            <div className="text-xs text-sidebar-foreground/60 truncate">
              {usuario?.nombre}
            </div>
            <div className="text-[11px] text-sidebar-foreground/40 truncate">
              {usuario?.email}
            </div>
            <SidebarMenuButton onClick={handleSignOut} className="w-full mt-2 text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-12 items-center border-b bg-background px-2 md:hidden">
            <SidebarTrigger />
            <span className="ml-2 text-sm font-semibold text-foreground">Noctis Hub</span>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
