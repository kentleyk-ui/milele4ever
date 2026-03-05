"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ServiceRequest {
  id: string
  service_type: string
  status: string
  full_name: string
  preferred_date: string | null
  location: string | null
  created_at: string
  memorials: { full_name: string } | null
}

interface ServiceRequestsListProps {
  requests: ServiceRequest[]
}

const serviceTypeLabels: Record<string, string> = {
  funeral: "Obseques completes",
  cremation: "Cremation",
  memorial_service: "Ceremonie commemorative",
  transport: "Transport funeraire",
  flowers: "Arrangements floraux",
  catering: "Reception / Traiteur",
  other: "Autre service",
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "bg-amber-500" },
  in_progress: { label: "En cours", icon: Loader2, color: "bg-blue-500" },
  completed: { label: "Termine", icon: CheckCircle, color: "bg-green-500" },
  cancelled: { label: "Annule", icon: XCircle, color: "bg-gray-500" },
}

export function ServiceRequestsList({ requests }: ServiceRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune demande</h3>
        <p className="text-muted-foreground text-sm">
          Vous n&apos;avez pas encore fait de demande de service
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status] || statusConfig.pending
        const StatusIcon = status.icon

        return (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-medium">
                    {serviceTypeLabels[request.service_type] || request.service_type}
                  </h3>
                  {request.memorials && (
                    <p className="text-sm text-muted-foreground">
                      Pour: {request.memorials.full_name}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <StatusIcon className={`h-3 w-3 ${request.status === 'in_progress' ? 'animate-spin' : ''}`} />
                  {status.label}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                {request.preferred_date && (
                  <p>Date souhaitee: {format(new Date(request.preferred_date), "d MMMM yyyy", { locale: fr })}</p>
                )}
                {request.location && (
                  <p>Lieu: {request.location}</p>
                )}
                <p className="text-xs">
                  Demande du {format(new Date(request.created_at), "d MMMM yyyy 'a' HH:mm", { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
