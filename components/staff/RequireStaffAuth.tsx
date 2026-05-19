"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Auth from "./Auth";
import ChooseRole from "./ChooseRole";
import PendingApproval from "./PendingApproval";
import RestrictedAccess from "./RestrictedAccess";
import ResetPassword from "./ResetPassword";
import { AeternumLoader } from "@/components/ui/AeternumLoader";

const PENDING_CONFIRMATION_KEY = "aeternum-staff-pending-confirmation-email";

type StaffStatus = "loading" | "unauthenticated" | "pending_role" | "pending_approval" | "approved" | "restricted" | "reset_password"

interface StaffProfile {
  status: string
  role_id: string | null
  accent_color?: unknown
}

function mustSetPassword(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return false
  return !!(metadata as { must_set_password?: boolean }).must_set_password
}

interface AdminState {
  restricted?: boolean
  restricted_reason?: string | null
}

function extractAdminState(accentColor: unknown): AdminState {
  if (!accentColor || typeof accentColor !== "object" || !("admin_state" in accentColor)) {
    return {}
  }

  const adminState = (accentColor as { admin_state?: AdminState }).admin_state
  return adminState && typeof adminState === "object" ? adminState : {}
}

export default function RequireStaffAuth({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<StaffStatus>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"chooser" | "awaiting_confirmation">("chooser");
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [restrictedReason, setRestrictedReason] = useState<string | null>(null);

  const clearPendingConfirmation = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PENDING_CONFIRMATION_KEY);
  }, []);

  const checkStaffProfile = useCallback(async (uid: string, email: string, provider?: string) => {
    const normalizedEmail = email.toLowerCase();

    if (provider === "google" && email !== "kentleyk@gmail.com") {
      await supabase.auth.signOut();
      setAuthError("La connexion Google est reservee a l'Administrateur Supreme.");
      setAuthView("chooser");
      setAuthEmail(null);
      setAuthStatus("unauthenticated");
      setUserId(null);
      setUserEmail("");
      setRoleId(null);
      return;
    }

    const { data: authData, error: authErrorResponse } = await supabase.auth.getUser();
    const currentUser = authData.user;

    if (authErrorResponse || !currentUser) {
      setAuthStatus("unauthenticated");
      return;
    }

    if (!currentUser.email_confirmed_at && normalizedEmail !== "kentleyk@gmail.com") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PENDING_CONFIRMATION_KEY, normalizedEmail)
      }
      await supabase.auth.signOut();
      setAuthError("Confirme ton courriel avant d'acceder a la page des choix.");
      setAuthView("awaiting_confirmation");
      setAuthEmail(normalizedEmail);
      setAuthStatus("unauthenticated");
      setUserId(null);
      setRoleId(null);
      return;
    }

    if (mustSetPassword(currentUser.user_metadata)) {
      setAuthStatus("reset_password");
      return;
    }

    // Kent est toujours admin suprême — auto-approuver si pas encore de profil
    if (email === "kentleyk@gmail.com") {
      clearPendingConfirmation();
      setAuthError(null);
      setAuthView("chooser");
      setAuthEmail(null);
      const { data } = await supabase
        .from("staff_profiles")
        .select("status, role_id, accent_color")
        .eq("user_id", uid)
        .single();
      const profile = data as StaffProfile | null;
      if (!profile || profile.status !== "approved") {
        // Créer/mettre à jour le profil de Kent directement
        await supabase.from("staff_profiles").upsert({
          user_id: uid,
          email,
          role: "admin-supreme",
          role_id: "admin-supreme",
          role_name: "Administrateur Suprême",
          role_category: "administration",
          status: "approved",
          approved_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
      setRoleId("admin-supreme");
      setAuthStatus("approved");
      return;
    }

    const { data } = await supabase
      .from("staff_profiles")
      .select("status, role_id, accent_color")
      .eq("user_id", uid)
      .single();

    const profile = data as StaffProfile | null;
    const adminState = extractAdminState(profile?.accent_color);
    setAuthError(null);
    setRestrictedReason(adminState.restricted_reason ?? null);

    if (adminState.restricted) {
      clearPendingConfirmation();
      setAuthStatus("restricted");
      return;
    }

    if (!profile) {
      clearPendingConfirmation();
      setAuthView("chooser");
      setAuthEmail(null);
      setAuthStatus("pending_role");
    } else if (profile.status === "pending_role") {
      clearPendingConfirmation();
      setAuthView("chooser");
      setAuthEmail(null);
      setAuthStatus("pending_role");
    } else if (profile.status === "pending_approval") {
      clearPendingConfirmation();
      setAuthView("chooser");
      setAuthEmail(null);
      setRoleId(profile.role_id);
      setAuthStatus("pending_approval");
    } else if (profile.status === "approved") {
      clearPendingConfirmation();
      setAuthView("chooser");
      setAuthEmail(null);
      setRoleId(profile.role_id);
      setAuthStatus("approved");
    } else {
      clearPendingConfirmation();
      setAuthView("chooser");
      setAuthEmail(null);
      setAuthStatus("pending_role");
    }
  }, [clearPendingConfirmation]);

  useEffect(() => {
    const bootstrap = async () => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const recoveryType = url.searchParams.get("type");
        const tokenHash = url.searchParams.get("token_hash");
        const resetFlag = url.searchParams.get("reset");

        if (recoveryType === "recovery" && tokenHash) {
          const { data: recoveryData, error: recoveryError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });

          url.searchParams.delete("type");
          url.searchParams.delete("token_hash");
          url.searchParams.delete("reset");
          window.history.replaceState({}, "", url.toString());

          if (recoveryError || !recoveryData.session?.user) {
            setAuthError("Lien de réinitialisation invalide ou expiré.");
            setAuthStatus("unauthenticated");
            return;
          }

          setUserId(recoveryData.session.user.id);
          setUserEmail(recoveryData.session.user.email ?? "");
          setAuthStatus("reset_password");
          return;
        }

        if (resetFlag === "1") {
          const { data: resetSession } = await supabase.auth.getSession();
          if (resetSession.session?.user) {
            setUserId(resetSession.session.user.id);
            setUserEmail(resetSession.session.user.email ?? "");
            setAuthStatus("reset_password");
            return;
          }
        }
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user) {
        setAuthStatus("unauthenticated");
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      await checkStaffProfile(user.id, user.email ?? "", typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : undefined);
    };

    void bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "PASSWORD_RECOVERY") {
        setAuthStatus("reset_password");
        return;
      }
      const user = session?.user ?? null;
      if (!user) {
        setAuthStatus("unauthenticated");
        setUserId(null);
        setRoleId(null);
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      void checkStaffProfile(user.id, user.email ?? "", typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : undefined);
    });

    return () => { listener?.subscription.unsubscribe(); };
  }, [checkStaffProfile]);

  if (authStatus === "reset_password") {
    return <ResetPassword mode="set_initial" onDone={() => setAuthStatus("loading")} />;
  }
  if (authStatus === "loading") return <AeternumLoader />;
  if (authStatus === "unauthenticated") {
    return <Auth initialError={authError} initialView={authView} initialEmail={authEmail} />;
  }
  if (authStatus === "pending_role" && userId) {
    return (
      <ChooseRole
        userId={userId}
        userEmail={userEmail}
        onRoleChosen={() => void checkStaffProfile(userId, userEmail)}
      />
    );
  }
  if (authStatus === "pending_approval" && userId) {
    return (
      <PendingApproval
        userId={userId}
        roleId={roleId}
        onApproved={() => setAuthStatus("approved")}
      />
    );
  }
  if (authStatus === "restricted") {
    return <RestrictedAccess reason={restrictedReason} />;
  }
  return <>{children}</>;
}
