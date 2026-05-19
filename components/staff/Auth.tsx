"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { buildAuthRedirect } from "@/lib/auth-redirect";
import { motion } from "framer-motion";
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";
import { Chrome, KeyRound, Link2, MailCheck, ShieldCheck, Eye, EyeOff } from "lucide-react";

const KENT_EMAIL = "kentleyk@gmail.com";
const PENDING_CONFIRMATION_KEY = "aeternum-staff-pending-confirmation-email";

type AuthView = "chooser" | "register" | "login" | "awaiting_confirmation" | "forgot_password" | "forgot_password_sent";

interface AuthProps {
  initialError?: string | null;
  initialView?: AuthView;
  initialEmail?: string | null;
}

export default function Auth({ initialError = null, initialView = "chooser", initialEmail = null }: AuthProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);
  const [isCheckingProgress, setIsCheckingProgress] = useState(false);
  const [lastProgressCheckAt, setLastProgressCheckAt] = useState<number | null>(null);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  useEffect(() => {
    setView(initialView);
    if (initialEmail) {
      setEmail(initialEmail);
      setConfirmationEmail(initialEmail);
    }
  }, [initialEmail, initialView]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pendingEmail = window.localStorage.getItem(PENDING_CONFIRMATION_KEY);
    if (pendingEmail) {
      setConfirmationEmail(pendingEmail);
      setEmail(pendingEmail);
      setView("awaiting_confirmation");
    }
  }, []);

  const isKentEmail = useMemo(() => email.trim().toLowerCase() === KENT_EMAIL, [email]);
  const confirmationRedirectUrl = useMemo(() => buildAuthRedirect("/staff"), []);

  function clearMessages() {
    setError(null);
    setInfo(null);
  }

  function goTo(nextView: AuthView) {
    clearMessages();
    setView(nextView);
  }

  function rememberPendingEmail(nextEmail: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PENDING_CONFIRMATION_KEY, nextEmail);
  }

  function clearPendingEmail() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PENDING_CONFIRMATION_KEY);
  }

  useEffect(() => {
    if (view !== "awaiting_confirmation") return;
    const targetEmail = (confirmationEmail ?? email).trim().toLowerCase();
    if (!targetEmail) return;

    let active = true;

    async function checkProgress() {
      setIsCheckingProgress(true);
      try {
        const response = await fetch(`/api/public/staff-signup-progress?email=${encodeURIComponent(targetEmail)}`);
        if (!response.ok || !active) return;

        setLastProgressCheckAt(Date.now());
        const payload = (await response.json()) as { exists?: boolean; emailConfirmed?: boolean };
        if (!payload.exists || !payload.emailConfirmed) return;

        clearPendingEmail();
        setConfirmationEmail(null);
        setEmail(targetEmail);
        setError(null);
        setInfo("Courriel confirme. Etape suivante: definir ton mot de passe.");
        setView("forgot_password");
      } finally {
        if (active) setIsCheckingProgress(false);
      }
    }

    void checkProgress();
    const intervalId = window.setInterval(() => {
      void checkProgress();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [view, confirmationEmail, email]);

  async function sendConfirmationEmail(emailAddress: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailAddress,
      options: {
        emailRedirectTo: confirmationRedirectUrl,
      },
    });

    return error;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    const emailAddress = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailAddress, password });
    if (error) {
      setError(error.message);
    } else if (!data.user?.email_confirmed_at && emailAddress !== KENT_EMAIL) {
      rememberPendingEmail(emailAddress);
      setConfirmationEmail(emailAddress);
      await supabase.auth.signOut();
      setError("Confirme d'abord ton courriel avant d'acceder a l'espace staff.");
      setView("awaiting_confirmation");
    } else if (data.user?.user_metadata && typeof data.user.user_metadata === "object" && "must_change_password" in data.user.user_metadata && data.user.user_metadata.must_change_password) {
      await supabase.auth.signOut();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailAddress, {
        redirectTo: buildAuthRedirect("/staff?reset=1"),
      });
      if (resetError) {
        setError("Mot de passe temporaire detecte. Utilise Mot de passe oublie pour le changer.");
      } else {
        setInfo("Mot de passe temporaire detecte. Un lien de changement vient d'etre envoye.");
        setView("forgot_password_sent");
      }
    } else {
      clearPendingEmail();
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);

    const emailAddress = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: {
        emailRedirectTo: confirmationRedirectUrl,
        shouldCreateUser: true,
        data: {
          staff_entry: "magic-link-first-access",
          must_set_password: true,
        },
      },
    });
    if (error) {
      setError(error.message);
    } else {
      rememberPendingEmail(emailAddress);
      setConfirmationEmail(emailAddress);
      setInfo(
        "Lien magique de confirmation envoye. Apres confirmation, tu choisiras ton mot de passe puis ton role."
      );
      setView("awaiting_confirmation");
    }
    setLoading(false);
  }

  async function handleResendConfirmation() {
    const targetEmail = (confirmationEmail ?? email).trim().toLowerCase();
    if (!targetEmail) {
      setError("Aucun courriel a renvoyer.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    const resendError = await sendConfirmationEmail(targetEmail);
    if (resendError) {
      setError(resendError.message);
    } else {
      rememberPendingEmail(targetEmail);
      setConfirmationEmail(targetEmail);
      setInfo("Nouveau lien magique envoye. Verifie aussi tes spams.");
    }

    setLoading(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    const emailAddress = email.trim().toLowerCase();
    if (!emailAddress) {
      setError("Saisis ton adresse courriel.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailAddress, {
      redirectTo: buildAuthRedirect("/staff?reset=1"),
    });
    if (error) {
      setError(error.message);
    } else {
      setView("forgot_password_sent");
    }
    setLoading(false);
  }

  async function handleProvider(provider: "google") {
    if (!isKentEmail) {
      setError("La connexion Google est reservee a Kent.");
      return;
    }

    setLoading(true); setError(null); setInfo(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: confirmationRedirectUrl,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  const BTN_W = 216;
  const BTN_H = 38;

  const inputCls =
    "w-full bg-white/80 dark:bg-white/5 border border-blue-950/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/30 px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200";

  function renderChooser() {
    return (
      <div className="space-y-3.5">
        <div className="rounded-2xl border border-blue-900/10 dark:border-white/10 bg-blue-950/5 dark:bg-white/5 p-3.5 space-y-2">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-sky-300 flex items-center justify-center flex-shrink-0">
              <Link2 size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Premiere visite</h3>
              <p className="text-xs text-slate-500 dark:text-white/45 mt-1">
                Lien magique et inscription donnent exactement le meme resultat: saisir le courriel, choisir un mot de passe, confirmer le courriel, puis acceder a la page des choix.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex justify-center">
              <LiquidMetalButton
                type="button"
                viewMode="text"
                tinted
                width={BTN_W}
                height={BTN_H}
                fontSize={12}
                leftIcon={<Link2 size={14} />}
                label="Lien magique"
                aria-label="Commencer avec le lien magique"
                onClick={() => goTo("register")}
              />
            </div>
            <button
              type="button"
              onClick={() => goTo("register")}
              className="text-xs text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Inscription classique, meme parcours
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-900/10 dark:border-white/10 bg-blue-950/5 dark:bg-white/5 p-3.5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Compte deja valide</h3>
              <p className="text-xs text-slate-500 dark:text-white/45 mt-1">
                Une fois approuve, la connexion par courriel et mot de passe renvoie directement sur le dashboard staff.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <LiquidMetalButton
              type="button"
              viewMode="text"
              tinted
              width={BTN_W}
              height={BTN_H}
              fontSize={12}
              label="Connexion"
              aria-label="Acceder a la connexion"
              onClick={() => goTo("login")}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderRegister() {
    return (
      <form className="space-y-3" onSubmit={handleRegister} autoComplete="off">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wide">Courriel</label>
          <input type="email" autoComplete="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200">
          Kent ne recoit la demande qu'apres confirmation du courriel, puis creation du mot de passe et choix du role par l'utilisateur.
        </div>
        <div className="flex justify-center pt-1">
          <LiquidMetalButton
            type="submit"
            disabled={loading}
            viewMode="text"
            tinted
            width={BTN_W}
            height={BTN_H}
            fontSize={12}
            leftIcon={<MailCheck size={14} />}
            label={loading ? "Preparation..." : "Continuer"}
            aria-label={loading ? "Creation en cours" : "Continuer avec le lien magique"}
          />
        </div>
        <button type="button" onClick={() => goTo("chooser")} className="w-full text-xs text-slate-500 dark:text-white/45 hover:text-slate-700 dark:hover:text-white transition-colors">
          Retour
        </button>
      </form>
    );
  }

  function renderLogin() {
    return (
      <form className="space-y-3" onSubmit={handleLogin} autoComplete="off">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wide">Courriel</label>
          <input type="email" autoComplete="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wide">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className={`${inputCls} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 dark:text-white/45 hover:text-slate-800 dark:hover:text-white"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="flex justify-center pt-1">
          <LiquidMetalButton
            type="submit"
            disabled={loading}
            viewMode="text"
            tinted
            width={BTN_W}
            height={BTN_H}
            fontSize={12}
            label={loading ? "Connexion..." : "Se connecter"}
            aria-label={loading ? "Connexion en cours" : "Se connecter"}
          />
        </div>
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-blue-900/10 dark:bg-white/10" />
          <span className="text-xs text-slate-500 dark:text-white/30">admin supreme</span>
          <div className="flex-1 h-px bg-blue-900/10 dark:bg-white/10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <LiquidMetalButton
            type="button"
            disabled={loading || !isKentEmail}
            viewMode="text"
            tinted
            width={BTN_W}
            height={BTN_H}
            fontSize={11}
            leftIcon={<Chrome size={12} />}
            label="Continuer avec Google"
            aria-label="Continuer avec Google"
            onClick={() => handleProvider("google")}
          />
          <p className="text-[11px] text-slate-500 dark:text-white/35 text-center px-2">
            Google est reserve a {KENT_EMAIL}. Saisis cette adresse pour activer le bouton.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            type="button"
            onClick={() => goTo("forgot_password")}
            className="text-xs text-blue-600 dark:text-sky-300 hover:text-blue-800 dark:hover:text-sky-200 transition-colors"
          >
            Mot de passe oublié ?
          </button>
          <button type="button" onClick={() => goTo("chooser")} className="w-full text-xs text-slate-500 dark:text-white/45 hover:text-slate-700 dark:hover:text-white transition-colors">
            Retour
          </button>
        </div>
      </form>
    );
  }

  function renderForgotPassword() {
    return (
      <form className="space-y-3" onSubmit={handleForgotPassword} autoComplete="off">
        <div className="text-center mb-1">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-blue-500/12 text-blue-600 dark:text-sky-300 flex items-center justify-center mb-2">
            <KeyRound size={22} />
          </div>
          <p className="text-xs text-slate-500 dark:text-white/45 leading-relaxed">
            Saisis ton courriel. Tu recevras un lien pour choisir un nouveau mot de passe.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wide">Courriel</label>
          <input type="email" autoComplete="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex justify-center pt-1">
          <LiquidMetalButton
            type="submit"
            disabled={loading}
            viewMode="text"
            tinted
            width={BTN_W}
            height={BTN_H}
            fontSize={12}
            leftIcon={<MailCheck size={14} />}
            label={loading ? "Envoi..." : "Envoyer le lien"}
            aria-label={loading ? "Envoi en cours" : "Envoyer le lien de réinitialisation"}
          />
        </div>
        <button type="button" onClick={() => goTo("login")} className="w-full text-xs text-slate-500 dark:text-white/45 hover:text-slate-700 dark:hover:text-white transition-colors">
          Retour
        </button>
      </form>
    );
  }

  function renderForgotPasswordSent() {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-inner">
          <MailCheck size={28} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lien envoyé</h3>
          <p className="text-xs text-slate-600 dark:text-white/45 mt-2 leading-relaxed">
            Un lien de réinitialisation a été envoyé à <span className="font-semibold text-slate-800 dark:text-white">{email}</span>. Vérifie aussi tes spams.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleForgotPassword({ preventDefault: () => {} } as React.FormEvent)}
            className="text-xs text-blue-600 dark:text-sky-300 hover:text-blue-800 dark:hover:text-sky-200 transition-colors disabled:opacity-50"
          >
            Renvoyer le lien
          </button>
          <button type="button" onClick={() => goTo("login")} className="text-xs text-slate-500 dark:text-white/45 hover:text-slate-700 dark:hover:text-white transition-colors">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  function renderAwaitingConfirmation() {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-left">
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-200">
            <span className={`inline-block w-2 h-2 rounded-full ${isCheckingProgress ? "animate-pulse" : ""}`} style={{ background: "#10b981" }} />
            <span className="font-semibold">Vérification en temps réel active</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-200/80 mt-1">
            {lastProgressCheckAt
              ? `Dernière vérification: ${new Date(lastProgressCheckAt).toLocaleTimeString("fr-FR")}`
              : "Première vérification en cours..."}
          </p>
        </div>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-inner">
          <MailCheck size={28} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Confirmation du courriel requise</h3>
          <p className="text-xs text-slate-600 dark:text-white/45 mt-2 leading-relaxed">
            Ouvre le message envoye a <span className="font-semibold text-slate-800 dark:text-white">{confirmationEmail}</span>, confirme ton adresse, puis tu choisiras ton mot de passe avant d'acceder a la page des roles.
          </p>
        </div>
        <div className="rounded-xl border border-blue-900/10 dark:border-white/10 bg-blue-950/5 dark:bg-white/5 px-3 py-3 text-left">
          <div className="text-xs font-semibold text-slate-700 dark:text-white/70 mb-1">Suite du parcours</div>
          <div className="text-[11px] text-slate-500 dark:text-white/45 leading-relaxed">
            1. Confirmation du courriel
            <br />
            2. Creation du mot de passe
            <br />
            3. Page de choix des roles
            <br />
            4. Message en attente d'approbation par l'Administrateur Supreme
            <br />
            5. Ouverture automatique du dashboard apres validation
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleResendConfirmation()}
            className="text-xs text-blue-600 dark:text-sky-300 hover:text-blue-800 dark:hover:text-sky-200 transition-colors disabled:opacity-50"
          >
            Renvoyer le lien magique de confirmation
          </button>
          <button
            type="button"
            onClick={() => {
              clearPendingEmail();
              setConfirmationEmail(null);
              setPassword("");
              goTo("register");
            }}
            className="text-xs text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Modifier le courriel
          </button>
          <button
            type="button"
            onClick={() => goTo("login")}
            className="text-xs text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            J'ai deja confirme mon compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[88vh] py-6 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-gray-900 relative overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-300/35 dark:bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-blue-400/30 dark:bg-indigo-700/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-cyan-300/25 dark:bg-cyan-500/15 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[290px] bg-white/88 dark:bg-white/10 backdrop-blur-2xl border border-blue-900/10 dark:border-white/15 rounded-3xl shadow-[0_30px_90px_rgba(15,23,42,0.22),0_0_0_1px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.55)] dark:shadow-[0_30px_90px_rgba(2,6,23,0.75),0_0_0_1px_rgba(96,165,250,0.24),inset_0_1px_0_rgba(255,255,255,0.15)] p-3"
      >
        <div className="flex flex-col items-center mb-3 pt-1">
          <div
            className="font-black text-[20px] leading-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              letterSpacing: "0.02em",
              color: "var(--primary)",
              textShadow: "0 2px 14px rgba(59,130,246,0.24)",
            }}
          >
            Aeternum
          </div>
          <div className="text-[10px] text-slate-500 dark:text-gray-400 tracking-[0.18em] uppercase mt-0.5">Staff Portal</div>
          <p className="text-[11px] text-slate-500 dark:text-white/35 text-center mt-2 px-3 leading-relaxed">
            Confirmation du courriel obligatoire avant le choix du role et l'envoi de la demande a Kent.
          </p>
        </div>
        {error && <div className="mb-2.5 px-4 py-2 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs">{error}</div>}
        {info && <div className="mb-2.5 px-4 py-2 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-500/30 rounded-xl text-blue-700 dark:text-blue-300 text-xs">{info}</div>}
        {view === "chooser" && renderChooser()}
        {view === "register" && renderRegister()}
        {view === "login" && renderLogin()}
        {view === "awaiting_confirmation" && renderAwaitingConfirmation()}
        {view === "forgot_password" && renderForgotPassword()}
        {view === "forgot_password_sent" && renderForgotPasswordSent()}
        <p className="mt-2.5 text-center text-[11px] text-slate-500 dark:text-white/25">Accès réservé au staff autorisé</p>
      </motion.div>
    </div>
  );
}
