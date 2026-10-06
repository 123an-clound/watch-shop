
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "lw_addresses": {
                  Row: {
                    "created_at": string,"id": string,"is_default": boolean,"note": string | null,"phone": string,"province": string,"recipient_name": string,"street": string,"updated_at": string,"user_id": string,"ward": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_default"?: boolean,"note"?: string | null,"phone": string,"province": string,"recipient_name": string,"street": string,"updated_at"?: string,"user_id": string,"ward": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_default"?: boolean,"note"?: string | null,"phone"?: string,"province"?: string,"recipient_name"?: string,"street"?: string,"updated_at"?: string,"user_id"?: string,"ward"?: string
                  }
                  Relationships: [
                    
                  ]
                },"lw_brands": {
                  Row: {
                    "created_at": string,"description_en": string | null,"description_vi": string | null,"id": string,"logo_url": string | null,"name": string,"slug": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"description_en"?: string | null,"description_vi"?: string | null,"id"?: string,"logo_url"?: string | null,"name": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description_en"?: string | null,"description_vi"?: string | null,"id"?: string,"logo_url"?: string | null,"name"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"lw_categories": {
                  Row: {
                    "created_at": string,"id": string,"name_en": string,"name_vi": string,"parent_id": string | null,"slug": string,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name_en": string,"name_vi": string,"parent_id"?: string | null,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name_en"?: string,"name_vi"?: string,"parent_id"?: string | null,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lw_categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "lw_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"lw_checkout_attempts": {
                  Row: {
                    "created_at": string,"id": number,"ip_hash": string | null,"phone": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: never,"ip_hash"?: string | null,"phone": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"ip_hash"?: string | null,"phone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"lw_order_items": {
                  Row: {
                    "created_at": string,"id": string,"image_path": string | null,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"sku": string,"unit_price": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_path"?: string | null,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"sku": string,"unit_price": number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_path"?: string | null,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"sku"?: string,"unit_price"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lw_order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "lw_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lw_order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "lw_products"
      referencedColumns: ["id"]
    }
                  ]
                },"lw_order_status_history": {
                  Row: {
                    "changed_by": string | null,"created_at": string,"from_status": string | null,"id": number,"note": string | null,"order_id": string,"to_status": string,"updated_at": string
                  }
                  Insert: {
                    "changed_by"?: string | null,"created_at"?: string,"from_status"?: string | null,"id"?: never,"note"?: string | null,"order_id": string,"to_status": string,"updated_at"?: string
                  }
                  Update: {
                    "changed_by"?: string | null,"created_at"?: string,"from_status"?: string | null,"id"?: never,"note"?: string | null,"order_id"?: string,"to_status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lw_order_status_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "lw_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"lw_orders": {
                  Row: {
                    "created_at": string,"customer_email": string | null,"customer_name": string,"customer_phone": string,"id": string,"locale": string,"order_code": string,"payment_method": string,"shipping_address": NonNullable<Json>,"shipping_fee": number,"status": string,"subtotal": number,"total": number,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"customer_email"?: string | null,"customer_name": string,"customer_phone": string,"id"?: string,"locale"?: string,"order_code": string,"payment_method"?: string,"shipping_address": NonNullable<Json>,"shipping_fee": number,"status"?: string,"subtotal": number,"total": number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"customer_email"?: string | null,"customer_name"?: string,"customer_phone"?: string,"id"?: string,"locale"?: string,"order_code"?: string,"payment_method"?: string,"shipping_address"?: NonNullable<Json>,"shipping_fee"?: number,"status"?: string,"subtotal"?: number,"total"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"lw_product_images": {
                  Row: {
                    "alt_en": string | null,"alt_vi": string | null,"created_at": string,"height": number,"id": string,"product_id": string,"sort_order": number,"storage_path": string,"updated_at": string,"width": number
                  }
                  Insert: {
                    "alt_en"?: string | null,"alt_vi"?: string | null,"created_at"?: string,"height": number,"id"?: string,"product_id": string,"sort_order"?: number,"storage_path": string,"updated_at"?: string,"width": number
                  }
                  Update: {
                    "alt_en"?: string | null,"alt_vi"?: string | null,"created_at"?: string,"height"?: number,"id"?: string,"product_id"?: string,"sort_order"?: number,"storage_path"?: string,"updated_at"?: string,"width"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lw_product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "lw_products"
      referencedColumns: ["id"]
    }
                  ]
                },"lw_products": {
                  Row: {
                    "brand_id": string | null,"category_id": string | null,"compare_at_price": number | null,"created_at": string,"description_en": string | null,"description_vi": string | null,"features": NonNullable<Json>,"id": string,"is_active": boolean,"is_featured": boolean,"name_en": string,"name_vi": string,"price": number,"search_vector": unknown,"seo_description_en": string | null,"seo_description_vi": string | null,"seo_title_en": string | null,"seo_title_vi": string | null,"sku": string,"slug": string,"stock": number,"updated_at": string
                  }
                  Insert: {
                    "brand_id"?: string | null,"category_id"?: string | null,"compare_at_price"?: number | null,"created_at"?: string,"description_en"?: string | null,"description_vi"?: string | null,"features"?: NonNullable<Json>,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name_en": string,"name_vi": string,"price": number,"search_vector"?: never,"seo_description_en"?: string | null,"seo_description_vi"?: string | null,"seo_title_en"?: string | null,"seo_title_vi"?: string | null,"sku": string,"slug": string,"stock"?: number,"updated_at"?: string
                  }
                  Update: {
                    "brand_id"?: string | null,"category_id"?: string | null,"compare_at_price"?: number | null,"created_at"?: string,"description_en"?: string | null,"description_vi"?: string | null,"features"?: NonNullable<Json>,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name_en"?: string,"name_vi"?: string,"price"?: number,"search_vector"?: never,"seo_description_en"?: string | null,"seo_description_vi"?: string | null,"seo_title_en"?: string | null,"seo_title_vi"?: string | null,"sku"?: string,"slug"?: string,"stock"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lw_products_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "lw_brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lw_products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "lw_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"lw_profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"phone": string | null,"role": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"phone"?: string | null,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"lw_site_settings": {
                  Row: {
                    "address": string | null,"contact_email": string | null,"contact_phone": string | null,"created_at": string,"free_shipping_threshold": number,"hero_image_path": string | null,"hero_subtitle_en": string | null,"hero_subtitle_vi": string | null,"hero_title_en": string | null,"hero_title_vi": string | null,"id": number,"shipping_fee": number,"social_links": NonNullable<Json>,"store_name": string,"updated_at": string
                  }
                  Insert: {
                    "address"?: string | null,"contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"free_shipping_threshold"?: number,"hero_image_path"?: string | null,"hero_subtitle_en"?: string | null,"hero_subtitle_vi"?: string | null,"hero_title_en"?: string | null,"hero_title_vi"?: string | null,"id"?: number,"shipping_fee"?: number,"social_links"?: NonNullable<Json>,"store_name"?: string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"free_shipping_threshold"?: number,"hero_image_path"?: string | null,"hero_subtitle_en"?: string | null,"hero_subtitle_vi"?: string | null,"hero_title_en"?: string | null,"hero_title_vi"?: string | null,"id"?: number,"shipping_fee"?: number,"social_links"?: NonNullable<Json>,"store_name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"lw_wishlists": {
                  Row: {
                    "created_at": string,"product_id": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"product_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"product_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lw_wishlists_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "lw_products"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "lw_admin_save_product":
{ Args: { "payload": Json }; Returns: Json
                           },
"lw_cancel_order":
{ Args: { "p_note"?: string,"p_order_id": string }; Returns: undefined
                           },
"lw_get_order_by_code":
{ Args: { "p_code": string,"p_phone": string }; Returns: Json
                           },
"lw_immutable_unaccent":
{ Args: { "": string }; Returns: string
                           },
"lw_is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"lw_place_order":
{ Args: { "payload": Json }; Returns: string
                           },
"lw_update_order_status":
{ Args: { "p_note"?: string,"p_order_id": string,"p_to_status": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
