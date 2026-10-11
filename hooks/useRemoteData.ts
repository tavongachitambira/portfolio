import { useEffect, useState } from "react";

export type RemoteState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error" };

/** `parse` must be a stable reference (define it at module level). */
export function useRemoteData<T>(
  url: string,
  parse: (json: unknown) => T,
): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setState({ status: "success", data: parse(json) }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ status: "error" });
      });

    return () => ctrl.abort();
  }, [url, parse]);

  return state;
}