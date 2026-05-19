"use client"

import { useEffect, useRef, useState } from "react"
import { useDossier } from "@/lib/dossier-context"
import { FileText, Upload, Trash2, Plus, FolderOpen } from "lucide-react"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { redirect } from "next/navigation"
import {
  clearVaultEnvelope,
  openVault,
  saveVaultItems,
  type VaultItem,
  type VaultItemType,
} from "@/lib/secure-vault"
import {
  clearBiometricCredential,
  hasBiometricCredential,
  isBiometricSupported,
  registerBiometricCredential,
  verifyBiometricPresence,
} from "@/lib/local-biometric"

const categories = [
  { value: "acte-deces", label: "Acte de décès" },
  { value: "assurance", label: "Assurance" },
  { value: "banque", label: "Banque" },
  { value: "notaire", label: "Notaire" },
  { value: "employeur", label: "Employeur" },
  { value: "identite", label: "Pièce d'identité" },
  { value: "autre", label: "Autre" },
]

export default function DocumentsPage() {
  const { dossier, hasDossier, addDocument, removeDocument, localOnlyMode, setLocalOnlyMode } = useDossier()
  const [showUpload, setShowUpload] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("acte-deces")
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [vaultPassphrase, setVaultPassphrase] = useState("")
  const [vaultUnlocked, setVaultUnlocked] = useState(false)
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [vaultBusy, setVaultBusy] = useState(false)
  const [vaultError, setVaultError] = useState<string | null>(null)
  const [vaultInfo, setVaultInfo] = useState<string | null>(null)
  const [newVaultType, setNewVaultType] = useState<VaultItemType>("note")
  const [newVaultTitle, setNewVaultTitle] = useState("")
  const [newVaultSecret, setNewVaultSecret] = useState("")
  const [rememberSession, setRememberSession] = useState(true)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)

  if (!hasDossier || !dossier) redirect("/espace")

  useEffect(() => {
    isBiometricSupported().then(setBiometricSupported).catch(() => setBiometricSupported(false))
    setBiometricRegistered(hasBiometricCredential())

    const cachedPassphrase = sessionStorage.getItem("milele-vault-session-passphrase")
    if (!cachedPassphrase) return

    setVaultBusy(true)
    openVault(cachedPassphrase)
      .then(({ items }) => {
        setVaultItems(items)
        setVaultPassphrase(cachedPassphrase)
        setVaultUnlocked(true)
      })
      .catch(() => {
        sessionStorage.removeItem("milele-vault-session-passphrase")
      })
      .finally(() => setVaultBusy(false))
  }, [])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      addDocument({
        name: file.name,
        category: selectedCategory,
        size: file.size,
      })
    })
    setShowUpload(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const grouped = categories.map(cat => ({
    ...cat,
    docs: dossier.documents.filter(d => d.category === cat.value),
  })).filter(g => g.docs.length > 0)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  async function unlockVault() {
    const passphrase = vaultPassphrase.trim()
    if (!passphrase) {
      setVaultError("Saisissez une phrase secrete.")
      return
    }

    setVaultBusy(true)
    setVaultError(null)
    setVaultInfo(null)

    try {
      const { exists, items } = await openVault(passphrase)
      if (!exists) {
        await saveVaultItems([], passphrase)
        setVaultInfo("Coffre initialise sur cet appareil.")
      }
      setVaultItems(items)
      setVaultUnlocked(true)
      if (rememberSession) {
        sessionStorage.setItem("milele-vault-session-passphrase", passphrase)
      }
    } catch {
      setVaultError("Phrase secrete invalide ou coffre illisible.")
    } finally {
      setVaultBusy(false)
    }
  }

  async function unlockVaultWithBiometric() {
    const cached = sessionStorage.getItem("milele-vault-session-passphrase")
    if (!cached) {
      setVaultError("Active d'abord 'retenir cette session' apres un deverrouillage manuel.")
      return
    }

    setVaultBusy(true)
    setVaultError(null)
    setVaultInfo(null)

    try {
      await verifyBiometricPresence()
      const { items } = await openVault(cached)
      setVaultPassphrase(cached)
      setVaultItems(items)
      setVaultUnlocked(true)
      setVaultInfo("Biometrie validee.")
    } catch {
      setVaultError("Validation biometrique echouee.")
    } finally {
      setVaultBusy(false)
    }
  }

  function lockVault() {
    setVaultUnlocked(false)
    setVaultItems([])
    setVaultError(null)
    setVaultInfo("Coffre verrouille.")
  }

  async function addVaultItem() {
    const title = newVaultTitle.trim()
    const secret = newVaultSecret.trim()

    if (!title || !secret) {
      setVaultError("Titre et contenu sont requis.")
      return
    }

    setVaultBusy(true)
    setVaultError(null)
    try {
      const now = new Date().toISOString()
      const nextItems: VaultItem[] = [
        {
          id: crypto.randomUUID(),
          type: newVaultType,
          title,
          secret,
          createdAt: now,
          updatedAt: now,
        },
        ...vaultItems,
      ]
      await saveVaultItems(nextItems, vaultPassphrase)
      setVaultItems(nextItems)
      setNewVaultTitle("")
      setNewVaultSecret("")
      setVaultInfo("Element ajoute au coffre.")
    } catch {
      setVaultError("Impossible d'enregistrer l'element.")
    } finally {
      setVaultBusy(false)
    }
  }

  async function removeVaultItem(itemId: string) {
    setVaultBusy(true)
    setVaultError(null)
    try {
      const nextItems = vaultItems.filter((item) => item.id !== itemId)
      await saveVaultItems(nextItems, vaultPassphrase)
      setVaultItems(nextItems)
    } catch {
      setVaultError("Suppression impossible.")
    } finally {
      setVaultBusy(false)
    }
  }

  async function enableBiometric() {
    setVaultBusy(true)
    setVaultError(null)
    try {
      await registerBiometricCredential()
      setBiometricRegistered(true)
      setVaultInfo("Biometrie activee sur cet appareil.")
    } catch {
      setVaultError("Activation biometrique annulee ou echouee.")
    } finally {
      setVaultBusy(false)
    }
  }

  function disableBiometric() {
    clearBiometricCredential()
    setBiometricRegistered(false)
    setVaultInfo("Biometrie desactivee pour cet appareil.")
  }

  async function resetVault() {
    const ok = window.confirm("Vider totalement le coffre securise local ?")
    if (!ok) return
    clearVaultEnvelope()
    sessionStorage.removeItem("milele-vault-session-passphrase")
    setVaultUnlocked(false)
    setVaultItems([])
    setVaultPassphrase("")
    setVaultInfo("Coffre local reinitialise.")
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {localOnlyMode ? (
        <div className="mb-4 rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-3 panel-surface-strong"
          style={{
            borderColor: "color-mix(in srgb, #10b981 35%, var(--border))",
            color: "var(--foreground)",
          }}
        >
          <span>Mode 100% local actif: aucune synchronisation cloud n'est envoyee depuis cet appareil.</span>
          <button
            onClick={() => setLocalOnlyMode(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{
              border: "1px solid color-mix(in srgb, #10b981 32%, var(--border))",
              background: "color-mix(in srgb, #10b981 10%, transparent)",
            }}
          >
            Desactiver
          </button>
        </div>
      ) : (
        <div className="mb-4 rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-3 panel-surface"
          style={{ color: "var(--foreground)" }}
        >
          <span>Synchronisation cloud activee.</span>
          <button
            onClick={() => setLocalOnlyMode(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{
              border: "1px solid color-mix(in srgb, var(--primary) 24%, var(--border))",
              background: "color-mix(in srgb, var(--primary) 8%, transparent)",
              color: "var(--foreground)",
            }}
          >
            Activer mode 100% local
          </button>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Documents
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {dossier.documents.length} document{dossier.documents.length !== 1 ? "s" : ""} enregistré{dossier.documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <LiquidMetalButton
          label="+ Ajouter"
          width={130}
          height={38}
          fontSize={12}
          tinted
          onClick={() => setShowUpload(true)}
        />
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowUpload(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-3xl p-6"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Ajouter un document
            </h2>

            {/* Catégorie */}
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Catégorie</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer transition-all"
              style={{
                background: dragOver ? "var(--secondary)" : "var(--card)",
                border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              <Upload size={24} style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
                Glissez un fichier ici ou <span style={{ color: "var(--primary)" }}>parcourez</span>
              </p>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            <button
              onClick={() => setShowUpload(false)}
              className="mt-4 w-full py-2.5 rounded-xl text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Documents groupés */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={40} style={{ color: "var(--border)", marginBottom: 12 }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Aucun document</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Ajoutez vos premiers documents importants
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(group => (
            <div key={group.value}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                {group.label}
              </h3>
              <div className="flex flex-col gap-2">
                {group.docs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <FileText size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{doc.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-2 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-3xl p-5 sm:p-6 panel-surface-strong">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Coffre securise local
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Notes sensibles, identifiants et references documents chiffrees localement (AES-GCM).
            </p>
          </div>
          {vaultUnlocked ? (
            <button
              onClick={lockVault}
              className="px-3 py-2 rounded-xl text-xs"
              style={{
                border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                color: "var(--foreground)",
                background: "color-mix(in srgb, var(--primary) 6%, transparent)",
              }}
            >
              Verrouiller
            </button>
          ) : null}
        </div>

        {vaultError ? (
          <div className="mb-3 rounded-xl border px-3 py-2 text-xs"
            style={{ borderColor: "color-mix(in srgb, #fb7185 35%, var(--border))", background: "color-mix(in srgb, #fb7185 10%, transparent)", color: "var(--foreground)" }}>
            {vaultError}
          </div>
        ) : null}
        {vaultInfo ? (
          <div className="mb-3 rounded-xl border px-3 py-2 text-xs"
            style={{ borderColor: "color-mix(in srgb, #10b981 30%, var(--border))", background: "color-mix(in srgb, #10b981 10%, transparent)", color: "var(--foreground)" }}>
            {vaultInfo}
          </div>
        ) : null}

        {!vaultUnlocked ? (
          <div className="space-y-3">
            <input
              type="password"
              value={vaultPassphrase}
              onChange={(e) => setVaultPassphrase(e.target.value)}
              placeholder="Phrase secrete du coffre"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />

            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
              />
              Retenir dans cette session (fermeture onglet = suppression)
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void unlockVault()}
                disabled={vaultBusy}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {vaultBusy ? "Ouverture..." : "Deverrouiller"}
              </button>

              {biometricSupported && biometricRegistered ? (
                <button
                  onClick={() => void unlockVaultWithBiometric()}
                  disabled={vaultBusy}
                  className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{ border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))", background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--foreground)" }}
                >
                  FaceID / Empreinte
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={newVaultType}
                onChange={(e) => setNewVaultType(e.target.value as VaultItemType)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <option value="note">Note privee</option>
                <option value="credential">Identifiant</option>
                <option value="document">Reference document</option>
              </select>
              <input
                value={newVaultTitle}
                onChange={(e) => setNewVaultTitle(e.target.value)}
                placeholder="Titre"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <textarea
              value={newVaultSecret}
              onChange={(e) => setNewVaultSecret(e.target.value)}
              placeholder={newVaultType === "credential" ? "Login, mot de passe, URL" : "Contenu confidentiel"}
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void addVaultItem()}
                disabled={vaultBusy}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
                style={{ background: "color-mix(in srgb, #10b981 70%, var(--primary))", color: "var(--primary-foreground)" }}
              >
                Ajouter au coffre
              </button>

              {biometricSupported && !biometricRegistered ? (
                <button
                  onClick={() => void enableBiometric()}
                  disabled={vaultBusy}
                  className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{ border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))", background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--foreground)" }}
                >
                  Activer FaceID / Empreinte
                </button>
              ) : null}

              {biometricRegistered ? (
                <button
                  onClick={disableBiometric}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))", color: "var(--foreground)", background: "color-mix(in srgb, var(--primary) 6%, transparent)" }}
                >
                  Desactiver biometrie
                </button>
              ) : null}

              <button
                onClick={() => void resetVault()}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
              >
                Vider le coffre
              </button>
            </div>

            {vaultItems.length === 0 ? (
              <div className="rounded-xl px-3 py-4 text-xs panel-surface" style={{ color: "var(--muted-foreground)" }}>
                Coffre vide.
              </div>
            ) : (
              <div className="space-y-2">
                {vaultItems.map((item) => (
                  <div key={item.id} className="rounded-xl px-3 py-3 panel-surface">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {item.title}
                        </div>
                        <div className="text-[11px] uppercase tracking-wide mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          {item.type}
                        </div>
                      </div>
                      <button
                        onClick={() => void removeVaultItem(item.id)}
                        className="p-2 rounded-lg text-rose-200 hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap text-xs" style={{ color: "var(--foreground)" }}>
                      {item.secret}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
