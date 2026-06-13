"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";
import { useStore } from "@/components/providers";
import { runAutoNotifications } from "@/lib/auto-notif";
import type { Notification, NotifType } from "@/lib/types";

function notifFromDb(r: Record<string, any>): Notification {
  return {
    id: r.id,
    type: r.type as NotifType,
    title: r.title,
    body: r.body,
    time: r.time,
    read: r.read,
  };
}

export function RealtimeSync() {
  const { state, update } = useStore();

  // Generate smart notifications once per session after store is populated
  useEffect(() => {
    const weddingId = getWeddingId();
    if (!weddingId || !state.wedding.date) return;
    runAutoNotifications(state, weddingId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.wedding.date]);

  useEffect(() => {
    const weddingId = getWeddingId();
    if (!weddingId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${weddingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          const newNotif = notifFromDb(payload.new as Record<string, any>);
          update("notifications", (prev) => [newNotif, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          const updated = notifFromDb(payload.new as Record<string, any>);
          update("notifications", (prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [update]);

  return null;
}
