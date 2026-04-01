'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Heart, MessageSquare, Flame, Check, Settings } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  // Mock notifications
  const notifications = [
    {
      id: '1',
      type: 'candle',
      title: 'Nouvelle bougie allumée',
      body: 'Marie a allumé une bougie sur le mémorial de Jean Dupont',
      timestamp: 'Il y a 2 heures',
      isRead: false
    },
    {
      id: '2',
      type: 'message',
      title: 'Nouveau message',
      body: 'Vous avez reçu un message de condoléances',
      timestamp: 'Il y a 5 heures',
      isRead: false
    },
    {
      id: '3',
      type: 'like',
      title: 'Nouvelle réaction',
      body: '3 personnes ont réagi à votre publication',
      timestamp: 'Hier',
      isRead: true
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'candle':
        return <Flame className="h-5 w-5 text-orange-500" />
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'like':
        return <Heart className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} non lues` : 'Toutes lues'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
          <Button variant="ghost" size="icon">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activité récente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune notification</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
