import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Exact mapping from production bundle
const COLOR_MAP: Record<string, string> = {
  accent_color: "--primary",
  background_color: "--background",
  surface_color: "--card",
  surface2_color: "--secondary",
  text_primary: "--foreground",
  text_secondary: "--muted-foreground",
  border_color: "--border",
  sidebar_color: "--sidebar-background",
  sidebar_text: "--sidebar-foreground",
  topbar_color: "--topbar-background",
  topbar_text: "--topbar-foreground",
  danger_color: "--destructive",
  success_color: "--success",
  warning_color: "--warning",
  tab_active_bg: "--tab-active-bg",
  tab_active_fg: "--tab-active-fg",
};

export function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function applyTheme(config: Record<string, string>) {
  const root = document.documentElement;

  // Apply color variables
  for (const [configKey, cssVar] of Object.entries(COLOR_MAP)) {
    if (config[configKey]) {
      root.style.setProperty(cssVar, hexToHSL(config[configKey]));
    }
  }

  // Sidebar accent follows tab active
  if (config.tab_active_bg) {
    root.style.setProperty("--sidebar-accent", hexToHSL(config.tab_active_bg));
  }
  if (config.tab_active_fg) {
    root.style.setProperty("--sidebar-accent-foreground", hexToHSL(config.tab_active_fg));
  }

  // Fonts
  if (config.body_font) {
    loadGoogleFont(config.body_font);
    root.style.setProperty("--font-body", `'${config.body_font}', sans-serif`);
  }
  if (config.heading_font) {
    loadGoogleFont(config.heading_font);
    root.style.setProperty("--font-heading", `'${config.heading_font}', sans-serif`);
  }

  // Border radius
  if (config.border_radius) {
    root.style.setProperty("--radius", `${config.border_radius}px`);
  }

  // Font size (scales the entire UI)
  if (config.font_size) {
    const size = parseFloat(config.font_size);
    root.style.fontSize = `${size}px`;
    root.style.setProperty("--sidebar-item-size", `${size}px`);
    root.style.setProperty("--sidebar-group-size", `${Math.max(10, size * 0.72)}px`);
    root.style.setProperty("--sidebar-brand-size", `${Math.max(24, size * 1.5)}px`);
    root.style.setProperty("--ui-scale", "1");
  }
}

// Default theme values (matches production)
export const DEFAULT_THEME: Record<string, string> = {
  accent_color: "#2d2d2d",
  background_color: "#fafafa",
  surface_color: "#ffffff",
  surface2_color: "#f0f0f0",
  text_primary: "#171717",
  text_secondary: "#737373",
  border_color: "#e5e5e5",
  sidebar_color: "#111111",
  sidebar_text: "#eaeaea",
  topbar_color: "#ffffff",
  topbar_text: "#171717",
  danger_color: "#dc2626",
  success_color: "#16a34a",
  warning_color: "#eab308",
  body_font: "Inter",
  heading_font: "Inter",
  border_radius: "10",
  font_size: "16",
  tab_active_bg: "#2d2d2d",
  tab_active_fg: "#ffffff",
  card1_color: "#3b82f6",
  card2_color: "#8b5cf6",
  card3_color: "#f59e0b",
  card4_color: "#10b981",
};

// Color field definitions for admin panel
export const COLOR_FIELDS = [
  { key: "background_color", label: "Fondo general", desc: "Color de fondo de toda la aplicación", group: "General" },
  { key: "surface_color", label: "Tarjetas y paneles", desc: "Color de las cards, diálogos y paneles elevados", group: "General" },
  { key: "surface2_color", label: "Fondo secundario", desc: "Elementos hover, fondos alternos y áreas secundarias", group: "General" },
  { key: "accent_color", label: "Color principal", desc: "Botones, enlaces activos y elementos de acción", group: "General" },
  { key: "border_color", label: "Bordes y separadores", desc: "Líneas divisorias entre secciones y bordes de inputs", group: "General" },
  { key: "text_primary", label: "Texto principal", desc: "Títulos, nombres y contenido importante", group: "Texto" },
  { key: "text_secondary", label: "Texto secundario", desc: "Descripciones, fechas y datos complementarios", group: "Texto" },
  { key: "sidebar_color", label: "Fondo sidebar", desc: "Color del menú lateral de navegación", group: "Navegación" },
  { key: "sidebar_text", label: "Texto sidebar", desc: "Color del texto e iconos del menú lateral", group: "Navegación" },
  { key: "topbar_color", label: "Fondo barra superior", desc: "Color de la barra de navegación superior", group: "Navegación" },
  { key: "topbar_text", label: "Texto barra superior", desc: "Color del texto en la barra superior", group: "Navegación" },
  { key: "tab_active_bg", label: "Pestaña activa (fondo)", desc: "Fondo de la pestaña o tab seleccionada", group: "Navegación" },
  { key: "tab_active_fg", label: "Pestaña activa (texto)", desc: "Texto de la pestaña o tab seleccionada", group: "Navegación" },
  { key: "danger_color", label: "Peligro / Error", desc: "Alertas críticas, errores y botones destructivos", group: "Estados" },
  { key: "success_color", label: "Éxito", desc: "Confirmaciones, estados completados y positivos", group: "Estados" },
  { key: "warning_color", label: "Aviso", desc: "Advertencias, estados pendientes e información", group: "Estados" },
  { key: "card1_color", label: "Card 1 — Total", desc: "Color del primer indicador del dashboard", group: "Dashboard" },
  { key: "card2_color", label: "Card 2 — Abiertas", desc: "Color del segundo indicador del dashboard", group: "Dashboard" },
  { key: "card3_color", label: "Card 3 — En proceso", desc: "Color del tercer indicador del dashboard", group: "Dashboard" },
  { key: "card4_color", label: "Card 4 — Resueltas", desc: "Color del cuarto indicador del dashboard", group: "Dashboard" },
];

// Palette presets
export const PALETTE_PRESETS = [
  {
    name: "Arena y Lino",
    desc: "Beige cálido, crema y tonos arena — elegancia natural",
    preview: ["#f5f0e8", "#ebe4d6", "#c9b99a", "#5c5142", "#8a7d6b"],
    values: {
      accent_color: "#8a7d6b", background_color: "#f5f0e8", surface_color: "#ebe4d6", surface2_color: "#e0d8c8",
      text_primary: "#3a3228", text_secondary: "#7a7062", border_color: "#d4cbb8",
      sidebar_color: "#3a3228", sidebar_text: "#e0d8c8", topbar_color: "#f5f0e8", topbar_text: "#3a3228",
      danger_color: "#a0422a", success_color: "#6b7a52", warning_color: "#c4a24c",
      body_font: "Inter", heading_font: "Cormorant Garamond", border_radius: "10",
      tab_active_bg: "#8a7d6b", tab_active_fg: "#f5f0e8",
      card1_color: "#8a7d6b", card2_color: "#a08e72", card3_color: "#6b7a52", card4_color: "#b09878",
    },
  },
  {
    name: "Madera Oscura",
    desc: "Marrones profundos con detalles cálidos — cabaña de lujo",
    preview: ["#1e1a15", "#2a2420", "#c9a84c", "#e8dcc8", "#3a3228"],
    values: {
      accent_color: "#c9a84c", background_color: "#1e1a15", surface_color: "#2a2420", surface2_color: "#342e28",
      text_primary: "#e8dcc8", text_secondary: "#9a8e78", border_color: "#3a3228",
      sidebar_color: "#161210", sidebar_text: "#c9b99a", topbar_color: "#221e18", topbar_text: "#e8dcc8",
      danger_color: "#a85040", success_color: "#6a7a4a", warning_color: "#c9a84c",
      body_font: "Inter", heading_font: "Playfair Display", border_radius: "10",
      tab_active_bg: "#c9a84c", tab_active_fg: "#1e1a15",
      card1_color: "#c9a84c", card2_color: "#8b7040", card3_color: "#6a7a4a", card4_color: "#7a6a50",
    },
  },
  {
    name: "Verde Militar",
    desc: "Oliva, caqui y tierra — tono robusto y natural",
    preview: ["#1c1f18", "#282c22", "#6b7a52", "#dcd6c4", "#3a3e30"],
    values: {
      accent_color: "#6b7a52", background_color: "#1c1f18", surface_color: "#282c22", surface2_color: "#32362a",
      text_primary: "#dcd6c4", text_secondary: "#9a9682", border_color: "#3a3e30",
      sidebar_color: "#141610", sidebar_text: "#b8b4a0", topbar_color: "#22251c", topbar_text: "#dcd6c4",
      danger_color: "#9a4232", success_color: "#7a8a5a", warning_color: "#b89a42",
      body_font: "DM Sans", heading_font: "Outfit", border_radius: "8",
      tab_active_bg: "#6b7a52", tab_active_fg: "#dcd6c4",
      card1_color: "#6b7a52", card2_color: "#5a6844", card3_color: "#8a7a4a", card4_color: "#4a5a3a",
    },
  },
  {
    name: "Amarillo Pastel",
    desc: "Crema suave, mantequilla y miel — luminoso y acogedor",
    preview: ["#faf6ee", "#f2eadb", "#b89a4c", "#4a4238", "#d4c4a0"],
    values: {
      accent_color: "#b89a4c", background_color: "#faf6ee", surface_color: "#f2eadb", surface2_color: "#e8dfc8",
      text_primary: "#4a4238", text_secondary: "#8a7e6a", border_color: "#d4c4a0",
      sidebar_color: "#4a4238", sidebar_text: "#e8dfc8", topbar_color: "#faf6ee", topbar_text: "#4a4238",
      danger_color: "#a84a30", success_color: "#6a7a4a", warning_color: "#c4a040",
      body_font: "Nunito", heading_font: "DM Serif Display", border_radius: "12",
      tab_active_bg: "#b89a4c", tab_active_fg: "#faf6ee",
      card1_color: "#b89a4c", card2_color: "#a08848", card3_color: "#6a7a4a", card4_color: "#c4a868",
    },
  },
  {
    name: "Piedra y Musgo",
    desc: "Gris piedra con acentos verde bosque — sereno y orgánico",
    preview: ["#f0ece6", "#e2ddd4", "#5a6a4a", "#3a3832", "#c8c2b4"],
    values: {
      accent_color: "#5a6a4a", background_color: "#f0ece6", surface_color: "#e2ddd4", surface2_color: "#d8d2c6",
      text_primary: "#3a3832", text_secondary: "#7a7568", border_color: "#c8c2b4",
      sidebar_color: "#3a3832", sidebar_text: "#d8d2c6", topbar_color: "#f0ece6", topbar_text: "#3a3832",
      danger_color: "#984838", success_color: "#5a6a4a", warning_color: "#b09040",
      body_font: "Work Sans", heading_font: "Libre Baskerville", border_radius: "10",
      tab_active_bg: "#5a6a4a", tab_active_fg: "#f0ece6",
      card1_color: "#5a6a4a", card2_color: "#7a8a62", card3_color: "#9a8a60", card4_color: "#4a5a3a",
    },
  },
];

export function useTheme() {
  const { hotelId } = useAuth();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!hotelId) return;
    loadTheme();
  }, [hotelId]);

  const loadTheme = async () => {
    try {
      const { data } = await supabase
        .from("configuracion")
        .select("clave, valor")
        .eq("hotel_id", hotelId!);

      const c: Record<string, string> = {};
      (data ?? []).forEach((item) => {
        if (item.valor) c[item.clave] = item.valor;
      });
      setConfig(c);
      applyTheme(c);
    } catch (err) {
      console.error("Error loading theme:", err);
    } finally {
      setLoaded(true);
    }
  };

  return { config, loaded, reloadTheme: loadTheme };
}
