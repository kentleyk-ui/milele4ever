"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, XCircle, Loader2, User } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ServiceRequest {
  id: string
  status: string
  deceased_full_name: string | null
  deceased_first_names: string | null
  service_type: string | null
  death_date: string | null
  created_at: string
}

interface ServiceRequestsListProps {
  requests: ServiceRequest[]
}

const serviceTypeLabels: Record<string, string> = {
  enterrement: "Enterrement",
  cremation: "Cremation",
  inhumation_ecologique: "Inhumation ecologique",
  ceremonie_virtuelle: "Ceremonie virtuelle",
  aucun: "Aucun service principal",
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: { label: "Soumise", icon: Clock, variant: "default" },
  processing: { label: "En traitement", icon: Loader2, variant: "secondary" },
  completed: { label: "Terminee", icon: CheckCircle, variant: "outline" },
  cancelled: { label: "Annulee", icon: XCircle, variant: "destructive" },
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
          Vous n&apos;avez pas encore soumis de demande de service
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status] || statusConfig.submitted
        const StatusIcon = status.icon
        const deceasedName = [request.deceased_first_names, request.deceased_full_name]
          .filter(Boolean)
          .join(" ") || "Non specifie"

        return (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">{deceasedName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {request.service_type ? serviceTypeLabels[request.service_type] : "Service non specifie"}
                    </p>
                  </div>
                </div>
                <Badge variant={status.variant} className="flex items-center gap-1">
                  <StatusIcon className={`h-3 w-3 ${request.status === 'processing' ? 'animate-spin' : ''}`} />
                  {status.label}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground space-y-1 pl-13">
                {request.death_date && (
                  <p>Date du deces: {format(new Date(request.death_date), "d MMMM yyyy", { locale: fr })}</p>
                )}
                <p className="text-xs">
                  Demande soumise le {format(new Date(request.created_at), "d MMMM yyyy 'a' HH:mm", { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
