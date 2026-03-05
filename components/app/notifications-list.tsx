"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  MessageSquare, 
  Heart, 
  Calendar, 
  Cake,
  FileText,
  CheckCheck
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, string> | null
  is_read: boolean
  created_at: string
}

interface NotificationsListProps {
  notifications: Notification[]
  userId: string
}

const notificationIcons: Record<string, React.ElementType> = {
  new_post: Heart,
  new_message: MessageSquare,
  memorial_invite: Bell,
  anniversary: Calendar,
  birthday: Cake,
  service_update: FileText,
}

const notificationColors: Record<string, string> = {
  new_post: "bg-pink-500",
  new_message: "bg-blue-500",
  memorial_invite: "bg-purple-500",
  anniversary: "bg-amber-500",
  birthday: "bg-green-500",
  service_update: "bg-cyan-500",
}

export function NotificationsList({ notifications, userId }: NotificationsListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [localNotifications, setLocalNotifications] = useState(notifications)

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)

    setLocalNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    setLocalNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    )
  }

  const getNotificationLink = (notification: Notification): string => {
    const data = notification.data || {}
    switch (notification.type) {
      case "new_post":
      case "memorial_invite":
        return data.memorial_id ? `/app/memorials/${data.memorial_id}` : "/app"
      case "new_message":
        return data.conversation_id ? `/app/messages/${data.conversation_id}` : "/app/messages"
      case "service_update":
        return "/app/services"
      default:
        return "/app"
    }
  }

  const unreadCount = localNotifications.filter(n => !n.is_read).length

  if (localNotifications.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune notification</h3>
        <p className="text-muted-foreground text-sm">
          Vous serez averti des nouvelles activites
        </p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end px-4 py-2">
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      <div className="divide-y divide-border">
        {localNotifications.map((notification) => {
          const Icon = notificationIcons[notification.type] || Bell
          const color = notificationColors[notification.type] || "bg-gray-500"
          const link = getNotificationLink(notification)

          return (
            <Link
              key={notification.id}
              href={link}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
              className={`flex items-start gap-3 p-4 transition-colors ${
                notification.is_read ? 'bg-background' : 'bg-primary/5'
              } hover:bg-muted/50`}
            >
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium ${!notification.is_read ? 'text-foreground' : ''}`}>
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
                {notification.body && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
