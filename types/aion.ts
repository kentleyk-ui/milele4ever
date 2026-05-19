// ============================================================
// MILELE — Types Aïon
// ============================================================

export type VisibilityLevel = "intime" | "famille" | "amis" | "public"

export type ContentType =
  | "mon_histoire"
  | "coffre_fort"
  | "capsules"
  | "journal"
  | "volontes"
  | "souvenirs"

export interface ContentItem {
  id: string
  owner_id: string
  content_type: ContentType
  title: string | null
  body: string | null
  metadata: Record<string, unknown>
  visibility: VisibilityLevel
  media_urls: string[]
  is_encrypted: boolean
  tags: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export type ContentItemInsert = Omit<ContentItem, "id" | "created_at" | "updated_at">
export type ContentItemUpdate = Partial<Omit<ContentItem, "id" | "owner_id" | "created_at">>

export type MemberStatus = "pending" | "active" | "declined" | "removed"
export type MemberRole = "member" | "executor" | "guardian"

export interface CircleMember {
  id: string
  owner_id: string
  member_user_id: string | null
  email: string
  display_name: string | null
  visibility_level: VisibilityLevel
  status: MemberStatus
  role: MemberRole
  invited_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export type CapsuleTriggerType = "date" | "death" | "event" | "manual"
export type CapsuleStatus = "draft" | "scheduled" | "delivered" | "opened" | "cancelled"

export interface CapsuleTemporelle {
  id: string
  content_item_id: string | null
  owner_id: string
  recipient_email: string
  recipient_name: string | null
  trigger_type: CapsuleTriggerType
  deliver_at: string | null
  trigger_event: string | null
  status: CapsuleStatus
  delivered_at: string | null
  opened_at: string | null
  personal_message: string | null
  created_at: string
  updated_at: string
}

export type VolonteCategory = "funeraire" | "medical" | "legal" | "personnel" | "numerique"

export interface Volonte {
  id: string
  owner_id: string
  category: VolonteCategory
  title: string
  body: string | null
  attachments: string[]
  visibility: VisibilityLevel
  is_locked: boolean
  confirmed: boolean
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface Memorial {
  id: string
  user_id: string
  slug: string | null
  display_name: string
  bio: string | null
  birth_date: string | null
  death_date: string | null
  cover_url: string | null
  avatar_url: string | null
  is_active: boolean
  theme: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type TributeType = "message" | "flower" | "candle" | "photo" | "memory"

export interface Tribute {
  id: string
  memorial_id: string
  author_name: string
  author_email: string | null
  author_user_id: string | null
  tribute_type: TributeType
  content: string | null
  media_url: string | null
  is_approved: boolean
  created_at: string
}

export interface AionActivity {
  id: string
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AionModule {
  key: ContentType
  label: string
  icon: string
  color: string
  description: string
  href: string
  count: number
}

export interface AionDashboardStats {
  totalContent: number
  circleMembers: number
  completionPct: number
  capsulesPending: number
  recentActivity: AionActivity[]
}

export const AION_MODULES: Omit<AionModule, "count">[] = [
  { key: "mon_histoire", label: "Mon Histoire", icon: "📖", color: "#8B5CF6", description: "Votre récit de vie, vos origines, vos valeurs", href: "/aion/mon-histoire" },
  { key: "coffre_fort", label: "Coffre-Fort", icon: "🔐", color: "#F59E0B", description: "Documents importants protégés", href: "/aion/coffre-fort" },
  { key: "capsules", label: "Capsules Temporelles", icon: "💊", color: "#3B82F6", description: "Messages programmés pour le futur", href: "/aion/capsules" },
  { key: "journal", label: "Journal Intime", icon: "📝", color: "#10B981", description: "Vos pensées et réflexions quotidiennes", href: "/aion/journal" },
  { key: "volontes", label: "Volontés", icon: "📜", color: "#EF4444", description: "Vos directives et dernières volontés", href: "/aion/volontes" },
  { key: "souvenirs", label: "Souvenirs", icon: "🖼️", color: "#EC4899", description: "Photos, vidéos et souvenirs précieux", href: "/aion/souvenirs" },
]

export const VISIBILITY_TIERS = [
  { key: "intime" as const, label: "Intime", icon: "💎", color: "#8B5CF6", description: "Accès total — vos personnes les plus proches" },
  { key: "famille" as const, label: "Famille", icon: "🏠", color: "#F59E0B", description: "Famille élargie et amis très proches" },
  { key: "amis" as const, label: "Amis", icon: "🤝", color: "#3B82F6", description: "Amis et proches de confiance" },
  { key: "public" as const, label: "Public", icon: "🌍", color: "#10B981", description: "Visible par tous après le passage" },
] as const
