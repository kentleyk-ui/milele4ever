"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StaffEmptyState, StaffPanel, StaffShell } from "@/components/staff/StaffDesignSystem";

type TicketNotification = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};

type NotificationItem = {
  id: string;
  type: "ticket" | "approval";
  title: string;
  subtitle: string;
  createdAt: string;
};

interface NotificationsProps {
  onCountsChange?: (count: number) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function Notifications({ onCountsChange }: NotificationsProps) {
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [criticalTickets, setCriticalTickets] = useState(0);
  const [recentTickets, setRecentTickets] = useState<TicketNotification[]>([]);
  const inFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const scheduledRef = useRef<number | null>(null);

  const loadData = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRefreshRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      const [pendingRes, openRes, criticalRes, recentRes] = await Promise.all([
        supabase.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("staff_tickets").select("id", { count: "exact", head: true }).in("status", ["Ouvert", "En cours"]),
        supabase.from("staff_tickets").select("id", { count: "exact", head: true }).eq("priority", "Critique"),
        supabase.from("staff_tickets").select("id, title, status, priority, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      if (pendingRes.error || openRes.error || criticalRes.error || recentRes.error) {
        console.error("[Notifications] Erreur chargement realtime", {
          pendingError: pendingRes.error,
          openError: openRes.error,
          criticalError: criticalRes.error,
          recentError: recentRes.error,
        });
        return;
      }

      setPendingApprovals(pendingRes.count ?? 0);
      setOpenTickets(openRes.count ?? 0);
      setCriticalTickets(criticalRes.count ?? 0);
      setRecentTickets((recentRes.data as TicketNotification[] | null) ?? []);

      const totalRealtimeAlerts = (pendingRes.count ?? 0) + (criticalRes.count ?? 0);
      onCountsChange?.(totalRealtimeAlerts);
    } catch (error) {
      console.error("[Notifications] Exception chargement realtime", error);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        void loadData();
      }
    }
  }, [onCountsChange]);

  const scheduleRefresh = useCallback(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = window.setTimeout(() => {
      scheduledRef.current = null;
      void loadData();
    }, 500);
  }, [loadData]);

  useEffect(() => {
    void loadData();

    const channelName = `staff-live-notifications-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, () => {
        scheduleRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_tickets" }, () => {
        scheduleRefresh();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          scheduleRefresh();
        }
        if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          scheduleRefresh();
        }
      });

    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => {
      window.clearInterval(interval);
      if (scheduledRef.current) window.clearTimeout(scheduledRef.current);
      scheduledRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [loadData, scheduleRefresh]);

  const feed = useMemo<NotificationItem[]>(() => {
    const approvals: NotificationItem[] = Array.from({ length: Math.min(pendingApprovals, 4) }).map((_, idx) => ({
      id: `approval-${idx}`,
      type: "approval",
      title: "Demande staff en attente",
      subtitle: "Un compte staff attend votre validation.",
      createdAt: new Date().toISOString(),
    }));

    const tickets: NotificationItem[] = recentTickets.map((ticket) => ({
      id: ticket.id,
      type: "ticket",
      title: `Ticket #${ticket.id.slice(0, 6)} · ${ticket.title}`,
      subtitle: `${ticket.priority} · ${ticket.status}`,
      createdAt: ticket.created_at,
    }));

    return [...approvals, ...tickets]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 12);
  }, [pendingApprovals, recentTickets]);

  return (
    <StaffShell maxWidthClass="max-w-6xl">
      <div>
        <h2 className="text-2xl font-black text-white">Notifications temps reel</h2>
        <p className="text-sm text-sky-100/60 mt-1">Suivi live des demandes staff et incidents tickets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Demandes staff</div>
          <div className="text-3xl font-black text-white mt-2">{pendingApprovals}</div>
        </div>
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-200/80">Tickets ouverts</div>
          <div className="text-3xl font-black text-white mt-2">{openTickets}</div>
        </div>
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-indigo-200/80">Tickets critiques</div>
          <div className="text-3xl font-black text-white mt-2">{criticalTickets}</div>
        </div>
      </div>

      <StaffPanel className="rounded-3xl border-white/10 bg-black/25 p-4 md:p-5">
        {loading ? (
          <StaffEmptyState title="Chargement des notifications" description="Synchronisation des alertes staff en cours." />
        ) : feed.length === 0 ? (
          <StaffEmptyState title="Aucune notification" description="Aucun signal critique pour le moment." />
        ) : (
          <div className="space-y-3">
            {feed.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-white/60 mt-1">{item.subtitle}</div>
                  </div>
                  <div className="text-[11px] text-white/45 whitespace-nowrap">{formatDate(item.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StaffPanel>
    </StaffShell>
  );
}
