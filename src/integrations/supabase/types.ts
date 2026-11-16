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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      pos_categorias: {
        Row: {
          created_at: string
          id: string
          nombre: string
          posicion: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id: string
          nombre: string
          posicion?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          posicion?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_categorias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orden_alimentos: {
        Row: {
          cantidad: number
          created_at: string
          orden_id: string
          precio_total: number
          precio_unitario: number
          producto_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          orden_id: string
          precio_total?: number
          precio_unitario?: number
          producto_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          orden_id?: string
          precio_total?: number
          precio_unitario?: number
          producto_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_orden_alimentos_workspace_id_orden_id_fkey"
            columns: ["workspace_id", "orden_id"]
            isOneToOne: false
            referencedRelation: "pos_ordenes"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      pos_ordenes: {
        Row: {
          created_at: string
          estado: string
          fecha: string
          id: string
          mesa: number
          mesero: string
          metodo_pago: string | null
          no_orden: number
          para_llevar: boolean
          posicion: number
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha: string
          id: string
          mesa?: number
          mesero?: string
          metodo_pago?: string | null
          no_orden: number
          para_llevar?: boolean
          posicion?: number
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          mesa?: number
          mesero?: string
          metodo_pago?: string | null
          no_orden?: number
          para_llevar?: boolean
          posicion?: number
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_ordenes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_productos: {
        Row: {
          categoria_id: string
          compra: boolean
          created_at: string
          disponible: number
          id: string
          minimo_reorden: number
          nombre: string
          pos: boolean
          posicion: number
          precio: number
          rastrear_inventario: boolean
          unidad_medida: string
          updated_at: string
          ventas: boolean
          workspace_id: string
        }
        Insert: {
          categoria_id?: string
          compra?: boolean
          created_at?: string
          disponible?: number
          id: string
          minimo_reorden?: number
          nombre: string
          pos?: boolean
          posicion?: number
          precio?: number
          rastrear_inventario?: boolean
          unidad_medida?: string
          updated_at?: string
          ventas?: boolean
          workspace_id: string
        }
        Update: {
          categoria_id?: string
          compra?: boolean
          created_at?: string
          disponible?: number
          id?: string
          minimo_reorden?: number
          nombre?: string
          pos?: boolean
          posicion?: number
          precio?: number
          rastrear_inventario?: boolean
          unidad_medida?: string
          updated_at?: string
          ventas?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_productos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_receta_ingredientes: {
        Row: {
          cantidad: number
          componente_producto_id: string
          created_at: string
          posicion: number
          producto_id: string
          unidad_medida: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cantidad?: number
          componente_producto_id: string
          created_at?: string
          posicion: number
          producto_id: string
          unidad_medida?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cantidad?: number
          componente_producto_id?: string
          created_at?: string
          posicion?: number
          producto_id?: string
          unidad_medida?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_receta_ingredientes_workspace_id_producto_id_fkey"
            columns: ["workspace_id", "producto_id"]
            isOneToOne: false
            referencedRelation: "pos_recetas"
            referencedColumns: ["workspace_id", "producto_id"]
          },
        ]
      }
      pos_recetas: {
        Row: {
          cantidad: number
          created_at: string
          posicion: number
          producto_id: string
          tipo: string
          unidades: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          posicion?: number
          producto_id: string
          tipo?: string
          unidades?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          posicion?: number
          producto_id?: string
          tipo?: string
          unidades?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_recetas_workspace_id_producto_id_fkey"
            columns: ["workspace_id", "producto_id"]
            isOneToOne: true
            referencedRelation: "pos_productos"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      pos_workspaces: {
        Row: {
          created_at: string
          id: string
          nombre: string
          revision: number
          siguiente_no_orden: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nombre: string
          revision?: number
          siguiente_no_orden?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          revision?: number
          siguiente_no_orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aprobado: boolean
          created_at: string
          id: string
          nombre: string
          puesto: string
          updated_at: string
        }
        Insert: {
          aprobado?: boolean
          created_at?: string
          id: string
          nombre?: string
          puesto?: string
          updated_at?: string
        }
        Update: {
          aprobado?: boolean
          created_at?: string
          id?: string
          nombre?: string
          puesto?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_pos_state: {
        Args: { p_expected_revision: number; p_state: Json }
        Returns: number
      }
    }
    Enums: {
      app_role: "encargado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["encargado"],
    },
  },
} as const
