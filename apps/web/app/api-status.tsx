"use client";

import { HealthResponseSchema, type HealthResponse } from "@sms/contracts";
import { useEffect, useState } from "react";

type State = { kind: "loading" } | { kind: "ok"; health: HealthResponse } | { kind: "error" };

/** Calls the API through the /api rewrite and shows whether it answered. */
export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((body: unknown) => setState({ kind: "ok", health: HealthResponseSchema.parse(body) }))
      .catch(() => setState({ kind: "error" }));
  }, []);

  if (state.kind === "loading") return <p>Checking the API…</p>;
  if (state.kind === "error")
    return <p className="status-error">API is not reachable on /api/health.</p>;

  const { health } = state;
  const databaseLabel = health.database === "ok" ? "up" : "down";

  return (
    <p className={health.database === "ok" ? "status-ok" : "status-error"}>
      API is up ({health.service}, {new Date(health.time).toLocaleTimeString()}). Database is{" "}
      {databaseLabel}.
    </p>
  );
}
