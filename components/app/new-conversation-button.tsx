"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Plus, Loader2, Search, Check } from "lucide-react"

interface User {
  id: string
  full_name: string
  avatar_url: string | null
}

interface NewConversationButtonProps {
  users: User[]
  currentUserId: string
}

export function NewConversationButton({ users, currentUserId }: NewConversationButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return

    setIsLoading(true)
    try {
      // Check if conversation already exists with these exact participants
      // For now, just create a new one

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single()

      if (convError) throw convError

      // Add current user as participant
      await supabase.from("conversation_participants").insert({
        conversation_id: conversation.id,
        user_id: currentUserId,
      })

      // Add selected users as participants
      await supabase.from("conversation_participants").insert(
        selectedUsers.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
        }))
      )

      setSelectedUsers([])
      setSearchQuery("")
      setOpen(false)
      router.push(`/app/messages/${conversation.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Selectionnez une ou plusieurs personnes
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Aucun utilisateur trouve
              </p>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.id)
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left font-medium">
                      {user.full_name}
                    </span>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={selectedUsers.length === 0 || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Creer ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
