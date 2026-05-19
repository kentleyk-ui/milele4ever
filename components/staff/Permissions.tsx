import React, { useState } from "react";
import { STAFF_BUTTON_DANGER, STAFF_BUTTON_GHOST, STAFF_BUTTON_PRIMARY, STAFF_FOCUS_RING, StaffNotice, StaffPanel, StaffShell } from "@/components/staff/StaffDesignSystem";

const ROLES = ["Admin", "Gestionnaire", "Support", "Modération", "Observateur"];

const PERMISSIONS = [
  {
    section: "Tickets",
    items: [
      { label: "Voir les tickets", access: [true, true, true, true, true] },
      { label: "Créer un ticket", access: [true, true, true, true, false] },
      { label: "Modifier un ticket", access: [true, true, true, false, false] },
      { label: "Assigner un ticket", access: [true, true, true, false, false] },
      { label: "Résoudre un ticket", access: [true, true, true, true, false] },
      { label: "Fermer un ticket", access: [true, true, true, false, false] },
      { label: "Supprimer un ticket", access: [true, true, false, false, false] },
    ],
  },
  {
    section: "Membres & Équipe",
    items: [
      { label: "Voir les membres", access: [true, true, true, true, true] },
      { label: "Inviter un membre", access: [true, true, false, false, false] },
      { label: "Modifier un membre", access: [true, true, false, false, false] },
      { label: "Désactiver un compte", access: [true, false, false, false, false] },
      { label: "Supprimer un membre", access: [true, false, false, false, false] },
    ],
  },
  {
    section: "Mémoriaux & Contenu",
    items: [
      { label: "Voir les mémoriaux", access: [true, true, true, true, true] },
      { label: "Modifier un mémorial", access: [true, true, false, true, false] },
      { label: "Supprimer un contenu", access: [true, true, false, true, false] },
      { label: "Valider un contenu", access: [true, true, false, true, false] },
    ],
  },
  {
    section: "Paiements & Abonnements",
    items: [
      { label: "Voir les transactions", access: [true, true, false, false, false] },
      { label: "Rembourser un paiement", access: [true, true, false, false, false] },
      { label: "Modifier abonnement", access: [true, false, false, false, false] },
    ],
  },
  {
    section: "Système & Analytiques",
    items: [
      { label: "Accès analytiques", access: [true, true, false, false, false] },
      { label: "Export de données", access: [true, true, false, false, false] },
      { label: "Gérer les permissions", access: [true, false, false, false, false] },
      { label: "Paramètres système", access: [true, false, false, false, false] },
      { label: "Logs d'activité", access: [true, true, false, false, false] },
    ],
  },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "text-rose-300",
  Gestionnaire: "text-violet-300",
  Support: "text-sky-300",
  "Modération": "text-amber-300",
  Observateur: "text-gray-400",
};

type PermissionItem = {
  label: string;
  access: boolean[];
};

type PermissionSection = {
  section: string;
  items: PermissionItem[];
};

const STORAGE_KEY = "staff_permissions_matrix_v1";

function clonePermissions(source: PermissionSection[]): PermissionSection[] {
  return source.map((section) => ({
    section: section.section,
    items: section.items.map((item) => ({
      label: item.label,
      access: [...item.access],
    })),
  }));
}

export default function Permissions() {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionSection[]>(() => {
    if (typeof window === "undefined") return clonePermissions(PERMISSIONS);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return clonePermissions(PERMISSIONS);
      const parsed = JSON.parse(raw) as PermissionSection[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : clonePermissions(PERMISSIONS);
    } catch {
      return clonePermissions(PERMISSIONS);
    }
  });
  const [draftPermissions, setDraftPermissions] = useState<PermissionSection[]>(() => clonePermissions(PERMISSIONS));
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [saveInfo, setSaveInfo] = useState<string | null>(null);

  const displayedPermissions = isEditing ? draftPermissions : permissions;
  const total = displayedPermissions.flatMap((s) => s.items).length;
  const roleStats = ROLES.map((r, i) => ({
    role: r,
    count: displayedPermissions.flatMap((s) => s.items).filter((p) => p.access[i]).length,
  }));

  function handleStartEdit() {
    setDraftPermissions(clonePermissions(permissions));
    setIsEditing(true);
    setSaveInfo(null);
  }

  function handleCancelEdit() {
    setDraftPermissions(clonePermissions(permissions));
    setIsEditing(false);
    setShowConfirmSave(false);
    setSaveInfo("Modifications annulées.");
  }

  function togglePermission(sectionIndex: number, itemIndex: number, roleIndex: number) {
    if (!isEditing) return;
    setDraftPermissions((prev) => {
      const next = clonePermissions(prev);
      next[sectionIndex].items[itemIndex].access[roleIndex] = !next[sectionIndex].items[itemIndex].access[roleIndex];
      return next;
    });
  }

  function handleConfirmSave() {
    const next = clonePermissions(draftPermissions);
    setPermissions(next);
    setIsEditing(false);
    setShowConfirmSave(false);
    setSaveInfo("Permissions enregistrées avec succès.");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  function handleSelectAll() {
    if (!isEditing) return;
    setDraftPermissions((prev) => {
      const next = clonePermissions(prev);
      const activeRoleIndex = activeRole ? ROLES.indexOf(activeRole) : -1;

      next.forEach((section) => {
        section.items.forEach((item) => {
          if (activeRoleIndex >= 0) {
            item.access[activeRoleIndex] = true;
          } else {
            item.access = item.access.map(() => true);
          }
        });
      });

      return next;
    });
  }

  return (
    <StaffShell maxWidthClass="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Matrice des Permissions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Rôles et niveaux d'accès — {total} permissions définies</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className={`${STAFF_BUTTON_PRIMARY} bg-gradient-to-r from-amber-500 to-orange-500`}
            >
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className={STAFF_BUTTON_GHOST}
              >
                Annuler
              </button>
              <button
                onClick={() => setShowConfirmSave(true)}
                className={`${STAFF_BUTTON_PRIMARY} bg-gradient-to-r from-emerald-500 to-teal-500`}
              >
                Sauvegarder
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <StaffNotice tone="info" className="border-amber-400/35 bg-amber-500/10 text-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Mode édition actif. Cliquez sur les cellules pour activer ou retirer un droit, puis cliquez sur Sauvegarder.
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className={`px-3 py-2 rounded-xl border border-emerald-400/30 bg-emerald-500/20 text-emerald-100 text-xs font-semibold hover:bg-emerald-500/30 transition ${STAFF_FOCUS_RING}`}
            title={activeRole ? `Sélectionner tous les droits pour ${activeRole}` : "Sélectionner tous les droits"}
          >
            {activeRole ? `Sélectionner tout (${activeRole})` : "Sélectionner tout"}
          </button>
        </StaffNotice>
      )}

      {saveInfo && (
        <StaffNotice tone="success">
          {saveInfo}
        </StaffNotice>
      )}

      {showConfirmSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowConfirmSave(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-rose-400/25 bg-slate-950 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Confirmer la sauvegarde des permissions</h2>
            <p className="text-sm text-white/70 mt-2">
              Vous allez modifier des droits critiques du staff. Cette action peut impacter l'accès aux fonctionnalités.
            </p>
            <p className="text-sm text-rose-300 mt-1">Confirmez-vous l'enregistrement de ces modifications ?</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmSave(false)}
                className={STAFF_BUTTON_GHOST}
              >
                Retour
              </button>
              <button
                onClick={handleConfirmSave}
                className={STAFF_BUTTON_DANGER}
              >
                Confirmer et enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats par rôle */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {roleStats.map((rs) => (
          <button
            key={rs.role}
            onClick={() => setActiveRole(activeRole === rs.role ? null : rs.role)}
            className={`rounded-xl p-4 bg-white/10 border text-left transition hover:bg-white/15 ${STAFF_FOCUS_RING} ${activeRole === rs.role ? "border-white/40 ring-2 ring-white/20" : "border-white/10"}`}
          >
            <div className={`text-xs font-semibold mb-1 ${ROLE_COLORS[rs.role]}`}>{rs.role}</div>
            <div className="text-2xl font-bold text-white tabular-nums">{rs.count}</div>
            <div className="text-xs text-gray-500">/ {total}</div>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <StaffPanel className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wide w-56">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${ROLE_COLORS[r]}`}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedPermissions.map((section, sectionIndex) => (
                <React.Fragment key={section.section}>
                  <tr className="bg-white/5">
                    <td colSpan={6} className="px-4 py-2 text-xs font-bold text-white/50 uppercase tracking-widest">{section.section}</td>
                  </tr>
                  {section.items.map((item, itemIndex) => (
                    <tr key={item.label} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-2.5 text-gray-300 text-sm">{item.label}</td>
                      {item.access.map((allowed, i) => (
                        <td key={i} className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={!isEditing}
                            onClick={() => togglePermission(sectionIndex, itemIndex, i)}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition ${
                              isEditing ? `hover:scale-110 ${STAFF_FOCUS_RING}` : "cursor-default"
                            } ${allowed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-600"}`}
                            title={isEditing ? `Basculer le droit pour ${ROLES[i]}` : "Passez en mode édition pour modifier"}
                            aria-label={`Droit ${item.label} pour ${ROLES[i]}`}
                          >
                            {allowed ? (
                              <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : (
                              <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </StaffPanel>
    </StaffShell>
  );
}
