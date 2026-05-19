"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";
import { KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";

interface ResetPasswordProps {
  onDone: () => void;
  mode?: "recovery" | "set_initial";
}

export default function ResetPassword({ onDone, mode = "recovery" }: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputCls =
    "w-full bg-white/80 dark:bg-white/5 border border-blue-950/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/30 px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        must_set_password: false,
        must_change_password: false,
      },
    });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => onDone(), 2200);
    }
    setLoading(false);
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
        className="relative z-10 w-full max-w-[290px] bg-white/88 dark:bg-white/10 backdrop-blur-2xl border border-blue-900/10 dark:border-white/15 rounded-3xl shadow-[0_30px_90px_rgba(15,23,42,0.22),0_0_0_1px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.55)] dark:shadow-[0_30px_90px_rgba(2,6,23,0.75),0_0_0_1px_rgba(96,165,250,0.24),inset_0_1px_0_rgba(255,255,255,0.15)] p-5"
      >
        <div className="flex flex-col items-center mb-4 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/12 text-blue-600 dark:text-sky-300 flex items-center justify-center mb-3">
            <KeyRound size={24} />
          </div>
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
            Créer votre mot de passe
          </div>
          <p className="text-[11px] text-slate-500 dark:text-white/35 text-center mt-2 px-2 leading-relaxed">
            {mode === "set_initial"
              ? "Confirme ton mot de passe pour finaliser l'activation de ton compte staff."
              : "Choisis un mot de passe sécurisé (min. 8 caractères)."}
          </p>
        </div>

        {error && (
          <div className="mb-3 px-4 py-2 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <ShieldCheck size={36} className="text-emerald-500" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Mot de passe mis à jour !</p>
            <p className="text-xs text-slate-500 dark:text-white/40">Redirection en cours…</p>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wide">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wide">
                Confirmer
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`${inputCls} pr-10`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 dark:text-white/45 hover:text-slate-800 dark:hover:text-white"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-center pt-1">
              <LiquidMetalButton
                type="submit"
                disabled={loading}
                viewMode="text"
                tinted
                width={216}
                height={38}
                fontSize={12}
                leftIcon={<ShieldCheck size={14} />}
                label={loading ? "Enregistrement..." : "Enregistrer"}
                aria-label={loading ? "Enregistrement en cours" : "Enregistrer le nouveau mot de passe"}
              />
            </div>
          </form>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-white/25">Accès réservé au staff autorisé</p>
      </motion.div>
    </div>
  );
}
