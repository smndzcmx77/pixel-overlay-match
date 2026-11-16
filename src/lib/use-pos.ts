import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadPOSFromSupabase, syncPOSToSupabase } from "@/lib/pos-db";
import type { POSState, UpdatePOS } from "@/lib/pos-store";

const LEGACY_KEY = "chilaqueria-pos-v1";
const REALTIME_TABLES = [
  "pos_workspaces",
  "pos_categorias",
  "pos_productos",
  "pos_recetas",
  "pos_receta_ingredientes",
  "pos_ordenes",
  "pos_orden_alimentos",
] as const;

export function usePOS() {
  const [state, setState] = useState<POSState | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(false);
  const stateRef = useRef<POSState | null>(null);
  const revisionRef = useRef(0);
  const writingRef = useRef(false);
  const mountedRef = useRef(true);

  const applySnapshot = useCallback((nextState: POSState, nextRevision: number) => {
    stateRef.current = nextState;
    revisionRef.current = nextRevision;
    if (mountedRef.current) {
      setState(nextState);
      setRevision(nextRevision);
    }
  }, []);

  const load = useCallback(async () => {
    const snapshot = await loadPOSFromSupabase();
    applySnapshot(snapshot.state, snapshot.revision);
    if (mountedRef.current) setError("");
    return snapshot;
  }, [applySnapshot]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      try {
        let snapshot = await loadPOSFromSupabase();
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          try {
            const localState = JSON.parse(legacy) as POSState;
            const nextRevision = await syncPOSToSupabase(localState, snapshot.revision);
            snapshot = { state: localState, revision: nextRevision };
            localStorage.removeItem(LEGACY_KEY);
            if (!cancelled) setImported(true);
          } catch (cause) {
            // Keep retryable network errors visible; discard only malformed legacy JSON.
            if (cause instanceof SyntaxError) localStorage.removeItem(LEGACY_KEY);
            else throw cause;
          }
        }
        if (!cancelled) {
          applySnapshot(snapshot.state, snapshot.revision);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos de Supabase.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [applySnapshot]);

  useEffect(() => {
    if (!state) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`pos-sync-${Math.random().toString(36).slice(2)}`);
    for (const table of REALTIME_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (writingRef.current) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!writingRef.current) void load().catch(() => undefined);
        }, 250);
      });
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [load, state === null]);

  const update: UpdatePOS = useCallback(async (fn) => {
    const previous = stateRef.current;
    if (!previous) throw new Error("Los datos todavía están cargando.");
    if (writingRef.current) throw new Error("Espera a que termine el guardado anterior.");

    const next = fn(previous);
    writingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const nextRevision = await syncPOSToSupabase(next, revisionRef.current);
      applySnapshot(next, nextRevision);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar en Supabase.";
      if (message.includes("REVISION_CONFLICT")) {
        await load().catch(() => undefined);
        throw new Error("Los datos cambiaron en otro dispositivo. Revisa la información actualizada y vuelve a intentar.");
      }
      setError(message);
      throw new Error("No se pudo guardar en Supabase. Inténtalo de nuevo.");
    } finally {
      writingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }, [applySnapshot, load]);

  const retry = useCallback(async () => {
    setLoading(true);
    try {
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos de Supabase.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  return { state, revision, update, loading, saving, error, imported, retry };
}
