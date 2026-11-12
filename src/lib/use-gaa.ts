import { useEffect, useState } from 'react';
import { loadGaa, type GaaResult } from './gaa';
import { usePortal, type Async } from './portal-context';

/**
 * The 2020–2026 programs that name the places, for any page that needs them.
 * `loadGaa` is memoised, so pages share one search. `null` when the scope
 * names no place (the GAA can only be searched by name).
 */
export function useGaa(): { state: Async<GaaResult> | null; progress: { done: number; total: number } | null; retry(): void } {
  const { client, config } = usePortal();
  const hasPlaces = (config.scope.places?.length ?? 0) > 0;
  const [state, setState] = useState<Async<GaaResult>>({ status: 'loading' });
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!hasPlaces) return;
    let live = true;
    loadGaa(client, config, (done, total) => live && setProgress({ done, total })).then(
      (value) => live && setState({ status: 'ready', value }),
      (error) => live && setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      live = false;
    };
  }, [client, config, hasPlaces, attempt]);
  return {
    state: hasPlaces ? state : null,
    progress,
    retry: () => {
      setState({ status: 'loading' });
      setAttempt((n) => n + 1);
    },
  };
}
