"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"

/* ═══ Types ═══ */
export interface Defunt {
  nom: string
  prenom: string
  dateNaissance?: string
  dateDeces: string
  relation: string // "parent", "conjoint", "enfant", "ami", "autre"
  lieuDeces?: string
}

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  phase: "48h" | "1semaine" | "1mois"
  done: boolean
  category: string
}

export interface Document {
  id: string
  name: string
  category: string // "acte-deces", "assurance", "banque", "notaire", "autre"
  uploadedAt: string
  size: number
}

export interface Contact {
  id: string
  nom: string
  relation: string
  telephone?: string
  email?: string
  notifie: boolean
  notifieAt?: string
}

export interface Dossier {
  id: string
  createdAt: string
  defunt: Defunt
  checklist: ChecklistItem[]
  documents: Document[]
  contacts: Contact[]
  excludedMemberIds: string[]
}

interface DossierContextType {
  dossier: Dossier | null
  hasDossier: boolean
  localOnlyMode: boolean
  setLocalOnlyMode: (enabled: boolean) => void
  createDossier: (defunt: Defunt) => void
  updateDefunt: (patch: Partial<Defunt>) => void
  updateChecklist: (itemId: string, done: boolean) => void
  addDocument: (doc: Omit<Document, "id" | "uploadedAt">) => void
  removeDocument: (docId: string) => void
  addContact: (contact: Omit<Contact, "id" | "notifie">) => void
  removeContact: (contactId: string) => void
  markContactNotified: (contactId: string) => void
  setMemberExclusion: (memberId: string, excluded: boolean) => void
  resetDossier: () => void
}

type SharedDossierSummary = {
  ownerId: string
  updatedAt: string
  defuntName: string | null
  excludedMemberIds: string[]
  summary: {
    total: number
    completed: number
    byPhase: { "48h": number; "1semaine": number; "1mois": number }
    completedByPhase: { "48h": number; "1semaine": number; "1mois": number }
  }
}

const DossierContext = createContext<DossierContextType | null>(null)

/* ═══ Checklist par défaut ═══ */
function defaultChecklist(): ChecklistItem[] {
  return [
    // 48 heures
    { id: "48h-1", label: "Faire constater le décès par un médecin", description: "Obtenir le certificat médical de décès", phase: "48h", done: false, category: "Médical" },
    { id: "48h-2", label: "Déclarer le décès à la mairie", description: "Dans les 24h, à la mairie du lieu de décès", phase: "48h", done: false, category: "Administratif" },
    { id: "48h-3", label: "Contacter les pompes funèbres", description: "Choisir un opérateur funéraire", phase: "48h", done: false, category: "Funéraire" },
    { id: "48h-4", label: "Prévenir la famille proche", description: "Informer les proches immédiats", phase: "48h", done: false, category: "Proches" },
    { id: "48h-5", label: "Récupérer le livret de famille", description: "Nécessaire pour la déclaration en mairie", phase: "48h", done: false, category: "Documents" },
    { id: "48h-6", label: "Vérifier l'existence d'un contrat obsèques", description: "Auprès de la banque ou de l'assureur", phase: "48h", done: false, category: "Funéraire" },
    // 1 semaine
    { id: "1s-1", label: "Organiser la cérémonie", description: "Date, lieu, type de cérémonie", phase: "1semaine", done: false, category: "Funéraire" },
    { id: "1s-2", label: "Prévenir l'employeur du défunt", description: "Et demander le solde de tout compte", phase: "1semaine", done: false, category: "Administratif" },
    { id: "1s-3", label: "Contacter la banque", description: "Bloquer les comptes, demander les soldes", phase: "1semaine", done: false, category: "Financier" },
    { id: "1s-4", label: "Prévenir les assurances", description: "Assurance vie, habitation, véhicule", phase: "1semaine", done: false, category: "Financier" },
    { id: "1s-5", label: "Contacter la caisse de retraite", description: "Signaler le décès, demander la pension de réversion", phase: "1semaine", done: false, category: "Administratif" },
    { id: "1s-6", label: "Prévenir la mutuelle", description: "Résiliation ou transfert", phase: "1semaine", done: false, category: "Administratif" },
    { id: "1s-7", label: "Publier un avis de décès", description: "Journal local ou en ligne", phase: "1semaine", done: false, category: "Proches" },
    // 1 mois
    { id: "1m-1", label: "Contacter le notaire", description: "Ouverture de la succession", phase: "1mois", done: false, category: "Succession" },
    { id: "1m-2", label: "Résilier les abonnements", description: "Téléphone, internet, électricité, etc.", phase: "1mois", done: false, category: "Administratif" },
    { id: "1m-3", label: "Mettre à jour la carte grise", description: "Si véhicule au nom du défunt", phase: "1mois", done: false, category: "Administratif" },
    { id: "1m-4", label: "Faire la déclaration de succession", description: "Auprès des impôts dans les 6 mois", phase: "1mois", done: false, category: "Succession" },
    { id: "1m-5", label: "Résilier ou transférer le bail", description: "Si le défunt était locataire", phase: "1mois", done: false, category: "Logement" },
    { id: "1m-6", label: "Demander le capital décès", description: "Auprès de la CPAM dans les 2 ans", phase: "1mois", done: false, category: "Financier" },
  ]
}

const STORAGE_KEY = "milele-dossier"
const LOCAL_ONLY_MODE_KEY = "milele-local-only-mode"

/* ═══ Helpers Supabase ═══ */
async function fetchCloudDossier(userId: string): Promise<Dossier | null> {
  const baseQuery = supabase
    .from("dossiers")
    .select("id, created_at, defunt, checklist, documents, contacts, excluded_member_ids")
    .eq("user_id", userId)
    .single()

  const { data, error } = await baseQuery
  const missingColumn = error && (error as { code?: string }).code === "42703"
  const fallback = missingColumn
    ? await supabase
        .from("dossiers")
        .select("id, created_at, defunt, checklist, documents, contacts")
        .eq("user_id", userId)
        .single()
    : null

  const row = (fallback?.data ?? data) as {
    id: string
    created_at: string
    defunt: Defunt
    checklist: ChecklistItem[]
    documents: Document[]
    contacts: Contact[]
    excluded_member_ids?: string[] | null
  } | null
  if (!row) return null
  return {
    id: row.id,
    createdAt: row.created_at,
    defunt: row.defunt,
    checklist: row.checklist,
    documents: row.documents,
    contacts: row.contacts,
    excludedMemberIds: row.excluded_member_ids ?? [],
  }
}

async function saveCloudDossier(userId: string, dossier: Dossier): Promise<void> {
  const payload = {
    user_id: userId,
    defunt: dossier.defunt,
    checklist: dossier.checklist,
    documents: dossier.documents,
    contacts: dossier.contacts,
    excluded_member_ids: dossier.excludedMemberIds,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("dossiers").upsert(payload, { onConflict: "user_id" })
  const missingColumn = error && (error as { code?: string }).code === "42703"
  if (missingColumn) {
    await supabase.from("dossiers").upsert(
      {
        user_id: userId,
        defunt: dossier.defunt,
        checklist: dossier.checklist,
        documents: dossier.documents,
        contacts: dossier.contacts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
  }
}

async function deleteCloudDossier(userId: string): Promise<void> {
  await supabase.from("dossiers").delete().eq("user_id", userId)
}

function buildSharedDossierSummary(userId: string, dossier: Dossier): SharedDossierSummary {
  const total = dossier.checklist.length
  const completed = dossier.checklist.filter((item) => item.done).length
  return {
    ownerId: userId,
    updatedAt: new Date().toISOString(),
    defuntName: [dossier.defunt.prenom, dossier.defunt.nom].filter(Boolean).join(" ") || null,
    excludedMemberIds: dossier.excludedMemberIds ?? [],
    summary: {
      total,
      completed,
      byPhase: {
        "48h": dossier.checklist.filter((item) => item.phase === "48h").length,
        "1semaine": dossier.checklist.filter((item) => item.phase === "1semaine").length,
        "1mois": dossier.checklist.filter((item) => item.phase === "1mois").length,
      },
      completedByPhase: {
        "48h": dossier.checklist.filter((item) => item.phase === "48h" && item.done).length,
        "1semaine": dossier.checklist.filter((item) => item.phase === "1semaine" && item.done).length,
        "1mois": dossier.checklist.filter((item) => item.phase === "1mois" && item.done).length,
      },
    },
  }
}

export function DossierProvider({ children }: { children: ReactNode }) {
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [localOnlyMode, setLocalOnlyModeState] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveChannel = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const setLocalOnlyMode = useCallback((enabled: boolean) => {
    setLocalOnlyModeState(enabled)
    localStorage.setItem(LOCAL_ONLY_MODE_KEY, enabled ? "1" : "0")
  }, [])

  useEffect(() => {
    const channel = supabase.channel("dossier-live")
    liveChannel.current = channel
    channel.subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  // Initialisation : charge depuis Supabase si connecté, sinon localStorage
  useEffect(() => {
    async function init() {
      const localOnly = localStorage.getItem(LOCAL_ONLY_MODE_KEY) === "1"
      setLocalOnlyModeState(localOnly)

      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? null
      setUserId(uid)

      if (uid && !localOnly) {
        const cloud = await fetchCloudDossier(uid)
        if (cloud) {
          setDossier(cloud)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud))
        } else {
          // Premier login : migrer le dossier local vers le cloud
          try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
              const local = JSON.parse(saved) as Dossier
              if (!Array.isArray(local.excludedMemberIds)) local.excludedMemberIds = []
              setDossier(local)
              await saveCloudDossier(uid, local)
            }
          } catch { /* ignore */ }
        }
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const local = JSON.parse(saved) as Dossier
            if (!Array.isArray(local.excludedMemberIds)) local.excludedMemberIds = []
            setDossier(local)
          }
        } catch { /* ignore */ }
      }
      setLoaded(true)
    }
    init()

    // Écouter les changements d'auth
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      const localOnly = localStorage.getItem(LOCAL_ONLY_MODE_KEY) === "1"
      if (event === "SIGNED_IN" && uid && !localOnly) {
        const cloud = await fetchCloudDossier(uid)
        if (cloud) {
          setDossier(cloud)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud))
        } else {
          // Pousser le dossier local vers le cloud
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            try {
              const local = JSON.parse(saved) as Dossier
              if (!Array.isArray(local.excludedMemberIds)) local.excludedMemberIds = []
              await saveCloudDossier(uid, local)
            } catch { /* ignore */ }
          }
        }
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Sauvegarder (localStorage immédiat + Supabase différé)
  useEffect(() => {
    if (!loaded) return
    if (dossier) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dossier))
      if (userId && !localOnlyMode) {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          void saveCloudDossier(userId, dossier).then(() => {
            if (liveChannel.current) {
              void liveChannel.current.send({
                type: "broadcast",
                event: "dossier-update",
                payload: buildSharedDossierSummary(userId, dossier),
              })
            }
          })
        }, 1500)
      }
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [dossier, loaded, userId, localOnlyMode])

  const createDossier = useCallback((defunt: Defunt) => {
    setDossier({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      defunt,
      checklist: defaultChecklist(),
      documents: [],
      contacts: [],
      excludedMemberIds: [],
    })
  }, [])

  const updateChecklist = useCallback((itemId: string, done: boolean) => {
    setDossier(prev => {
      if (!prev) return prev
      return {
        ...prev,
        checklist: prev.checklist.map(item =>
          item.id === itemId ? { ...item, done } : item
        ),
      }
    })
  }, [])

  const updateDefunt = useCallback((patch: Partial<Defunt>) => {
    setDossier(prev => {
      if (!prev) return prev
      return {
        ...prev,
        defunt: {
          ...prev.defunt,
          ...patch,
        },
      }
    })
  }, [])

  const addDocument = useCallback((doc: Omit<Document, "id" | "uploadedAt">) => {
    setDossier(prev => {
      if (!prev) return prev
      return {
        ...prev,
        documents: [...prev.documents, { ...doc, id: crypto.randomUUID(), uploadedAt: new Date().toISOString() }],
      }
    })
  }, [])

  const removeDocument = useCallback((docId: string) => {
    setDossier(prev => {
      if (!prev) return prev
      return { ...prev, documents: prev.documents.filter(d => d.id !== docId) }
    })
  }, [])

  const addContact = useCallback((contact: Omit<Contact, "id" | "notifie">) => {
    setDossier(prev => {
      if (!prev) return prev
      return {
        ...prev,
        contacts: [...prev.contacts, { ...contact, id: crypto.randomUUID(), notifie: false }],
      }
    })
  }, [])

  const removeContact = useCallback((contactId: string) => {
    setDossier(prev => {
      if (!prev) return prev
      return { ...prev, contacts: prev.contacts.filter(c => c.id !== contactId) }
    })
  }, [])

  const markContactNotified = useCallback((contactId: string) => {
    setDossier(prev => {
      if (!prev) return prev
      return {
        ...prev,
        contacts: prev.contacts.map(c =>
          c.id === contactId ? { ...c, notifie: true, notifieAt: new Date().toISOString() } : c
        ),
      }
    })
  }, [])

  const setMemberExclusion = useCallback((memberId: string, excluded: boolean) => {
    setDossier(prev => {
      if (!prev) return prev
      const current = new Set(prev.excludedMemberIds ?? [])
      if (excluded) current.add(memberId)
      else current.delete(memberId)
      return { ...prev, excludedMemberIds: Array.from(current) }
    })
  }, [])

  const resetDossier = useCallback(() => {
    setDossier(null)
    if (userId && !localOnlyMode) {
      void deleteCloudDossier(userId)
    }
  }, [localOnlyMode, userId])

  if (!loaded) return null

  return (
    <DossierContext.Provider value={{
      dossier,
      hasDossier: !!dossier,
      localOnlyMode,
      setLocalOnlyMode,
      createDossier,
      updateDefunt,
      updateChecklist,
      addDocument,
      removeDocument,
      addContact,
      removeContact,
      markContactNotified,
      setMemberExclusion,
      resetDossier,
    }}>
      {children}
    </DossierContext.Provider>
  )
}

export function useDossier() {
  const ctx = useContext(DossierContext)
  if (!ctx) throw new Error("useDossier must be used within DossierProvider")
  return ctx
}
