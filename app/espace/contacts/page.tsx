"use client"

import { useEffect, useRef, useState } from "react"
import { useDossier } from "@/lib/dossier-context"
import { useLocale } from "@/lib/locale-context"
import { Users, Plus, Trash2, Send, Check, UserPlus, Phone, Mail, Search, X, Download } from "lucide-react"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { redirect, useRouter, useSearchParams } from "next/navigation"

type DeviceContact = {
  name?: string[]
  tel?: string[]
  email?: string[]
}

export default function ContactsPage() {
  const { dossier, hasDossier, addContact, removeContact, markContactNotified } = useDossier()
  const { formatDate } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nom: "", relation: "", telephone: "", email: "" })
  const [importInfo, setImportInfo] = useState("")
  const autoImportStarted = useRef(false)
  const [contactSearch, setContactSearch] = useState("")

  const exportCSV = () => {
    if (!dossier) return
    const rows = [
      ["Nom", "Relation", "Téléphone", "Email", "Prévenu"].join(","),
      ...dossier.contacts.map(c => [
        `"${c.nom}"`, `"${c.relation}"`, `"${c.telephone ?? ""}"`, `"${c.email ?? ""}"`, c.notifie ? "Oui" : "Non"
      ].join(","))
    ].join("\n")
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "contacts-prevenir.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  if (!hasDossier || !dossier) redirect("/espace")

  const handleAdd = () => {
    if (!form.nom) return
    addContact({
      nom: form.nom,
      relation: form.relation,
      telephone: form.telephone || undefined,
      email: form.email || undefined,
    })
    setForm({ nom: "", relation: "", telephone: "", email: "" })
    setShowAdd(false)
  }

  const notified = dossier.contacts.filter(c => c.notifie)
  const pending = dossier.contacts.filter(c => !c.notifie)

  const filteredPending = contactSearch.trim()
    ? pending.filter(c => c.nom.toLowerCase().includes(contactSearch.toLowerCase()) || c.relation.toLowerCase().includes(contactSearch.toLowerCase()))
    : pending
  const filteredNotified = contactSearch.trim()
    ? notified.filter(c => c.nom.toLowerCase().includes(contactSearch.toLowerCase()))
    : notified

  const importFromDeviceContacts = async () => {
    const nav = navigator as Navigator & {
      contacts?: {
        select?: (properties: string[], options?: { multiple?: boolean }) => Promise<DeviceContact[]>
      }
    }

    if (!nav.contacts?.select) {
      setImportInfo("Import des contacts non supporte sur cet appareil/navigateur.")
      return
    }

    try {
      const selected = await nav.contacts.select(["name", "tel", "email"], { multiple: true })
      if (!selected.length) {
        setImportInfo("Aucun contact selectionne.")
        return
      }

      let added = 0
      for (const contact of selected) {
        const nom = contact.name?.find(Boolean)?.trim()
        if (!nom) continue

        addContact({
          nom,
          relation: "",
          telephone: contact.tel?.find(Boolean) || undefined,
          email: contact.email?.find(Boolean) || undefined,
        })
        added += 1
      }

      setImportInfo(`${added} contact${added > 1 ? "s" : ""} ajoute${added > 1 ? "s" : ""} automatiquement.`)
    } catch {
      setImportInfo("Acces aux contacts refuse ou annule.")
    }
  }

  useEffect(() => {
    if (searchParams.get("import") !== "1" || autoImportStarted.current) return
    autoImportStarted.current = true
    void importFromDeviceContacts().finally(() => {
      router.replace("/espace/contacts")
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router])

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Personnes à prévenir
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {notified.length} prévenue{notified.length !== 1 ? "s" : ""} · {pending.length} en attente
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dossier.contacts.length > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
              <Download size={13} /> CSV
            </button>
          )}
          <LiquidMetalButton
            label="+ Ajouter"
            width={130}
            height={38}
            fontSize={12}
            tinted
            onClick={() => setShowAdd(true)}
          />
        </div>
      </div>

      {importInfo && (
        <p className="text-xs mb-4" style={{ color: "var(--primary)" }}>
          {importInfo}
        </p>
      )}

      {/* Modal ajout */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-3xl p-6"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Ajouter un contact
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Nom *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom complet"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Relation</label>
                <input
                  type="text"
                  value={form.relation}
                  onChange={e => setForm(f => ({ ...f, relation: e.target.value }))}
                  placeholder="Ex: Oncle, Collègue, Voisin..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="06 ..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-center" style={{ opacity: form.nom ? 1 : 0.4, pointerEvents: form.nom ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                <LiquidMetalButton
                  label="Ajouter le contact"
                  width={220}
                  height={42}
                  fontSize={13}
                  tinted
                  onClick={handleAdd}
                />
              </div>
              <button onClick={() => setShowAdd(false)} className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre recherche */}
      {dossier.contacts.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--muted-foreground)" }} />
          <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
            placeholder="Rechercher un contact…" className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }} />
          {contactSearch && <button onClick={() => setContactSearch("")}><X size={13} style={{ color: "var(--muted-foreground)" }} /></button>}
        </div>
      )}

      {/* Contacts en attente */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
            À prévenir ({pending.length})
          </h3>
          <div className="flex flex-col gap-2">
            {filteredPending.map(contact => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--secondary)", color: "var(--primary)" }}
                >
                  {contact.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{contact.nom}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {[contact.relation, contact.telephone, contact.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                {contact.telephone && (
                  <a
                    href={`tel:${contact.telephone.replace(/\s/g, "")}`}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
                    style={{ background: "var(--secondary)", color: "var(--primary)" }}
                    title={`Appeler ${contact.nom}`}
                  >
                    <Phone size={14} />
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}?subject=${encodeURIComponent(`Décès de ${dossier.defunt.prenom} ${dossier.defunt.nom}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe vous écris pour vous informer du décès de ${dossier.defunt.prenom} ${dossier.defunt.nom}, survenu le ${new Date(dossier.defunt.dateDeces).toLocaleDateString("fr-FR")}.\n\nCordialement`)}`}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
                    style={{ background: "var(--secondary)", color: "var(--primary)" }}
                    title={`Envoyer un email à ${contact.nom}`}
                  >
                    <Mail size={14} />
                  </a>
                )}
                <button
                  onClick={() => markContactNotified(contact.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  <Check size={12} />
                  Prévenu
                </button>
                <button
                  onClick={() => removeContact(contact.id)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Trash2 size={14} />
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts prévenus */}
      {notified.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
            Prévenus ({notified.length})
          </h3>
          <div className="flex flex-col gap-2">
            {filteredNotified.map(contact => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-4 rounded-2xl opacity-60"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--secondary)", color: "var(--primary)" }}
                >
                  <Check size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{contact.nom}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Prévenu(e) le {contact.notifieAt ? formatDate(contact.notifieAt) : "—"}
                  </p>
                </div>
                <button
                  onClick={() => removeContact(contact.id)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vide */}
      {dossier.contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserPlus size={40} style={{ color: "var(--border)", marginBottom: 12 }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Aucun contact</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Ajoutez les personnes à prévenir du décès
          </p>
        </div>
      )}
    </div>
  )
}
