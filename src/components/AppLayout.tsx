import { useMemo } from "react";
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

type AppRole = "empleado" | "admin" | "super_admin";

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  requiredRole?: AppRole;
  group: "navegacion" | "gestion" | "super_admin";
}

const roleRank: Record<AppRole, number> = {
  empleado: 0,
  admin: 1,
  super_admin: 2,
};

const navigationItems: NavigationItem[] = [
  { label: "Panel", path: "/panel", icon: LayoutDashboard, group: "navegacion" },
  { label: "Checklists", path: "/checklists", icon: ClipboardList, group: "navegacion" },
  { label: "Incidencias", path: "/incidencias", icon: AlertTriangle, group: "navegacion" },
  { label: "Alarmas", path: "/alarmas", icon: Bell, group: "navegacion" },
  { label: "Agenda", path: "/agenda", icon: Calendar, group: "navegacion" },
  { label: "Informes", path: "/informes", icon: BarChart3, requiredRole: "super_admin", group: "super_admin" },
  { label: "Equipo", path: "/equipo", icon: Users, requiredRole: "super_admin", group: "super_admin" },
  { label: "Administración", path: "/administracion", icon: Settings, requiredRole: "super_admin", group: "super_admin" },
  { label: "Hoteles", path: "/hoteles", icon: Hotel, requiredRole: "super_admin", group: "super_admin" },
  { label: "Historial", path: "/historial", icon: History, requiredRole: "super_admin", group: "super_admin" },
];

const groupLabels: Record<NavigationItem["group"], string> = {
  navegacion: "Navegación",
  gestion: "Gestión",
  super_admin: "Super Admin",
};

const canAccess = (role: AppRole | null, requiredRole?: AppRole) => {
  if (!requiredRole) return Boolean(role);
  if (!role) return false;
  return roleRank[role] >= roleRank[requiredRole];
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, role, signOut, loading } = useAuth();
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = useMemo(
    () => navigationItems.filter((item) => canAccess(role, item.requiredRole)),
    [role]
  );

  const groupedItems = useMemo(() => ({
    navegacion: visibleItems.filter((item) => item.group === "navegacion"),
    gestion: visibleItems.filter((item) => item.group === "gestion"),
    super_admin: visibleItems.filter((item) => item.group === "super_admin"),
  }), [visibleItems]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider key={role ?? "guest"}>
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
            {(["navegacion", "gestion", "super_admin"] as const).map((groupKey) => {
              const items = groupedItems[groupKey];

              if (items.length === 0) {
                return null;
              }

              return (
                <SidebarGroup key={groupKey}>
                  <SidebarGroupLabel className="uppercase tracking-widest text-[10px] text-sidebar-foreground/40 font-semibold">
                    {groupLabels[groupKey]}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            onClick={() => navigate(item.path)}
                            isActive={location.pathname === item.path}
                            style={{ fontSize: "var(--sidebar-item-size)" }}
                            className={location.pathname === item.path ? "bg-[hsl(var(--tab-active-bg))] text-[hsl(var(--tab-active-fg))]" : ""}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>
          <SidebarFooter className="p-4 space-y-2">
            {!loading && role && (
              <>
                <div className="text-xs text-sidebar-foreground/60 truncate">
                  {usuario?.nombre}
                </div>
                <div className="text-[11px] text-sidebar-foreground/40 truncate">
                  {usuario?.email}
                </div>
              </>
            )}
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
