import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Map config keys from DB to CSS variable names
const COLOR_MAP: Record<string, string> = {
  bg_color: "--background",
  foreground_color: "--foreground",
  card_bg: "--card",
  card_fg: "--card-foreground",
  primary_color: "--primary",
  primary_fg: "--primary-foreground",
  secondary_color: "--secondary",
  secondary_fg: "--secondary-foreground",
  muted_color: "--muted",
  muted_fg: "--muted-foreground",
  accent_color: "--accent",
  accent_fg: "--accent-foreground",
  border_color: "--border",
  input_color: "--input",
  sidebar_bg: "--sidebar-background",
  sidebar_fg: "--sidebar-foreground",
  topbar_bg: "--topbar-background",
  topbar_fg: "--topbar-foreground",
  tab_active_bg: "--tab-active-bg",
  tab_active_fg: "--tab-active-fg",
  destructive_color: "--destructive",
  success_color: "--success",
  warning_color: "--warning",
  ring_color: "--ring",
};

function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
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

  const applyTheme = (c: Record<string, string>) => {
    const root = document.documentElement;

    // Apply color variables
    Object.entries(COLOR_MAP).forEach(([configKey, cssVar]) => {
      const value = c[configKey];
      if (value) {
        const hsl = hexToHSL(value);
        if (hsl) {
          root.style.setProperty(cssVar, hsl);
        }
      }
    });

    // Apply font heading
    if (c.font_heading) {
      root.style.setProperty("--font-heading", `"${c.font_heading}", -apple-system, BlinkMacSystemFont, sans-serif`);
      root.style.setProperty("--font-body", `"${c.font_heading}", -apple-system, BlinkMacSystemFont, sans-serif`);
    }

    // Apply font size (scales entire UI via html font-size -> rem)
    if (c.font_size) {
      root.style.fontSize = `${c.font_size}px`;
    }

    // Apply border radius
    if (c.border_radius) {
      root.style.setProperty("--radius", `${c.border_radius}px`);
    }

    // Apply UI scale
    if (c.ui_scale) {
      const scale = parseFloat(c.ui_scale);
      if (!isNaN(scale)) {
        const baseFontSize = parseFloat(c.font_size || "14");
        root.style.fontSize = `${baseFontSize * scale}px`;
      }
    }
  };

  return { config, loaded, reloadTheme: loadTheme };
}
