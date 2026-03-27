export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      actividad_incidencia: {
        Row: {
          created_at: string
          descripcion: string
          hotel_id: string
          id: string
          incidencia_id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          hotel_id: string
          id?: string
          incidencia_id: string
          tipo?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          hotel_id?: string
          id?: string
          incidencia_id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actividad_incidencia_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividad_incidencia_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividad_incidencia_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda: {
        Row: {
          alerta_fecha: string | null
          alerta_mensaje: string | null
          created_at: string
          fecha: string
          hotel_id: string
          id: string
          nota: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          alerta_fecha?: string | null
          alerta_mensaje?: string | null
          created_at?: string
          fecha: string
          hotel_id: string
          id?: string
          nota?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          alerta_fecha?: string | null
          alerta_mensaje?: string | null
          created_at?: string
          fecha?: string
          hotel_id?: string
          id?: string
          nota?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_globales: {
        Row: {
          atendida: boolean | null
          atendida_en: string | null
          atendida_por: string | null
          creado_por: string | null
          created_at: string | null
          fecha_alerta: string | null
          hotel_id: string
          id: string
          mensaje: string
        }
        Insert: {
          atendida?: boolean | null
          atendida_en?: string | null
          atendida_por?: string | null
          creado_por?: string | null
          created_at?: string | null
          fecha_alerta?: string | null
          hotel_id: string
          id?: string
          mensaje: string
        }
        Update: {
          atendida?: boolean | null
          atendida_en?: string | null
          atendida_por?: string | null
          creado_por?: string | null
          created_at?: string | null
          fecha_alerta?: string | null
          hotel_id?: string
          id?: string
          mensaje?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_globales_atendida_por_fkey"
            columns: ["atendida_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_globales_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_globales_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          fecha: string
          hotel_id: string
          id: string
          nombre_archivo: string
          usuario: string | null
        }
        Insert: {
          fecha?: string
          hotel_id: string
          id?: string
          nombre_archivo: string
          usuario?: string | null
        }
        Update: {
          fecha?: string
          hotel_id?: string
          id?: string
          nombre_archivo?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backups_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backups_usuario_fkey"
            columns: ["usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_checklist: {
        Row: {
          activo: boolean
          color: string | null
          created_at: string
          departamento: Database["public"]["Enums"]["departamento"]
          hotel_id: string
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          color?: string | null
          created_at?: string
          departamento: Database["public"]["Enums"]["departamento"]
          hotel_id: string
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          color?: string | null
          created_at?: string
          departamento?: Database["public"]["Enums"]["departamento"]
          hotel_id?: string
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_checklist_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_incidencia: {
        Row: {
          autor: string | null
          creado_en: string
          hotel_id: string
          id: string
          incidencia_id: string
          texto: string
        }
        Insert: {
          autor?: string | null
          creado_en?: string
          hotel_id: string
          id?: string
          incidencia_id: string
          texto: string
        }
        Update: {
          autor?: string | null
          creado_en?: string
          hotel_id?: string
          id?: string
          incidencia_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_incidencia_autor_fkey"
            columns: ["autor"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_incidencia_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_incidencia_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          clave: string
          hotel_id: string
          id: string
          valor: string | null
        }
        Insert: {
          clave: string
          hotel_id: string
          id?: string
          valor?: string | null
        }
        Update: {
          clave?: string
          hotel_id?: string
          id?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
      hoteles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      incidencias: {
        Row: {
          asignado_a: string | null
          creado_en: string
          creado_por: string | null
          departamento: Database["public"]["Enums"]["departamento"]
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_incidencia"]
          foto_url: string | null
          hotel_id: string
          id: string
          prioridad: Database["public"]["Enums"]["prioridad_incidencia"]
          titulo: string
          updated_at: string
        }
        Insert: {
          asignado_a?: string | null
          creado_en?: string
          creado_por?: string | null
          departamento: Database["public"]["Enums"]["departamento"]
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_incidencia"]
          foto_url?: string | null
          hotel_id: string
          id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_incidencia"]
          titulo: string
          updated_at?: string
        }
        Update: {
          asignado_a?: string | null
          creado_en?: string
          creado_por?: string | null
          departamento?: Database["public"]["Enums"]["departamento"]
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_incidencia"]
          foto_url?: string | null
          hotel_id?: string
          id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_incidencia"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_checklist: {
        Row: {
          created_at: string
          departamento: Database["public"]["Enums"]["departamento"]
          fecha: string
          hotel_id: string
          id: string
          nota: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          departamento: Database["public"]["Enums"]["departamento"]
          fecha?: string
          hotel_id: string
          id?: string
          nota?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          departamento?: Database["public"]["Enums"]["departamento"]
          fecha?: string
          hotel_id?: string
          id?: string
          nota?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_checklist_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_checklist_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      recordatorios_incidencia: {
        Row: {
          created_at: string
          fecha_alerta: string
          hotel_id: string
          id: string
          incidencia_id: string
          mensaje: string | null
          usuario_id: string
          visto: boolean
        }
        Insert: {
          created_at?: string
          fecha_alerta: string
          hotel_id: string
          id?: string
          incidencia_id: string
          mensaje?: string | null
          usuario_id: string
          visto?: boolean
        }
        Update: {
          created_at?: string
          fecha_alerta?: string
          hotel_id?: string
          id?: string
          incidencia_id?: string
          mensaje?: string | null
          usuario_id?: string
          visto?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_incidencia_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_incidencia_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_incidencia_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_checklist: {
        Row: {
          completado_a: string
          completado_por: string | null
          fecha: string
          hotel_id: string
          id: string
          tarea_id: string
        }
        Insert: {
          completado_a?: string
          completado_por?: string | null
          fecha?: string
          hotel_id: string
          id?: string
          tarea_id: string
        }
        Update: {
          completado_a?: string
          completado_por?: string | null
          fecha?: string
          hotel_id?: string
          id?: string
          tarea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_checklist_completado_por_fkey"
            columns: ["completado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_checklist_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_checklist_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          activo: boolean
          categoria_id: string | null
          color: string | null
          created_at: string
          departamento: Database["public"]["Enums"]["departamento"]
          descripcion: string | null
          hotel_id: string
          id: string
          orden: number
          tipo: string
          titulo: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          color?: string | null
          created_at?: string
          departamento: Database["public"]["Enums"]["departamento"]
          descripcion?: string | null
          hotel_id: string
          id?: string
          orden?: number
          tipo?: string
          titulo: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          color?: string | null
          created_at?: string
          departamento?: Database["public"]["Enums"]["departamento"]
          descripcion?: string | null
          hotel_id?: string
          id?: string
          orden?: number
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_checklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_pospuestas: {
        Row: {
          created_at: string
          fecha_destino: string
          fecha_original: string
          hotel_id: string
          id: string
          pospuesto_por: string | null
          tarea_id: string
        }
        Insert: {
          created_at?: string
          fecha_destino: string
          fecha_original: string
          hotel_id: string
          id?: string
          pospuesto_por?: string | null
          tarea_id: string
        }
        Update: {
          created_at?: string
          fecha_destino?: string
          fecha_original?: string
          hotel_id?: string
          id?: string
          pospuesto_por?: string | null
          tarea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_pospuestas_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_pospuestas_pospuesto_por_fkey"
            columns: ["pospuesto_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_pospuestas_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean
          auth_id: string | null
          created_at: string
          departamento: Database["public"]["Enums"]["departamento"]
          email: string
          hotel_id: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          activo?: boolean
          auth_id?: string | null
          created_at?: string
          departamento?: Database["public"]["Enums"]["departamento"]
          email: string
          hotel_id: string
          id?: string
          nombre: string
          rol?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          activo?: boolean
          auth_id?: string | null
          created_at?: string
          departamento?: Database["public"]["Enums"]["departamento"]
          email?: string
          hotel_id?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_departamento: {
        Args: { _auth_id: string }
        Returns: Database["public"]["Enums"]["departamento"]
      }
      get_user_hotel_id: { Args: { _auth_id: string }; Returns: string }
      get_user_role: {
        Args: { _auth_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_super_admin: { Args: { _auth_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "empleado" | "admin" | "super_admin"
      departamento:
        | "recepcion"
        | "limpieza"
        | "fyb"
        | "mantenimiento"
        | "administracion"
        | "direccion"
      estado_incidencia: "abierta" | "en_proceso" | "resuelta" | "cerrada"
      prioridad_incidencia: "baja" | "media" | "alta" | "urgente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["empleado", "admin", "super_admin"],
      departamento: [
        "recepcion",
        "limpieza",
        "fyb",
        "mantenimiento",
        "administracion",
        "direccion",
      ],
      estado_incidencia: ["abierta", "en_proceso", "resuelta", "cerrada"],
      prioridad_incidencia: ["baja", "media", "alta", "urgente"],
    },
  },
} as const
