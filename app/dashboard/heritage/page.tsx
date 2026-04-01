'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, FolderOpen, Lock, Download } from "lucide-react"

export default function HeritagePage() {
  // Mock documents
  const documents = [
    {
      id: '1',
      name: 'Testament.pdf',
      type: 'pdf',
      size: '245 KB',
      uploadedAt: '15 Mars 2026',
      isPrivate: true
    },
    {
      id: '2',
      name: 'Acte de propriété.pdf',
      type: 'pdf',
      size: '1.2 MB',
      uploadedAt: '10 Mars 2026',
      isPrivate: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Héritage</h1>
          <p className="text-muted-foreground mt-1">Documents importants et coffre-fort numérique</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Téléverser un document
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Coffre-fort sécurisé</h3>
              <p className="text-sm text-muted-foreground">
                Vos documents sont chiffrés et protégés. Seuls vous et vos bénéficiaires désignés peuvent y accéder.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Mes documents
          </CardTitle>
          <CardDescription>Documents importants stockés en toute sécurité</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{doc.name}</p>
                      {doc.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doc.size} - Ajouté le {doc.uploadedAt}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Aucun document</p>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Téléverser votre premier document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
