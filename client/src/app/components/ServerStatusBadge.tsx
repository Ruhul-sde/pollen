import { useEffect, useState } from "react";
import { checkServerHealth, ServerHealthResponse } from "../api";

export function ServerStatusBadge() {
  const [health, setHealth] = useState<ServerHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await checkServerHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend unreachable");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Recheck status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = !!health && health.database.status === "connected";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-[11px] font-medium text-neutral-600 shadow-xs transition-all hover:bg-neutral-100"
      title={
        loading
          ? "Checking backend server connection..."
          : isConnected
          ? `Server Connected (Port 5001) • MongoDB: ${health?.database.database || "connected"}`
          : error || "Server offline"
      }
    >
      <span
        className={`h-2 w-2 rounded-full transition-colors ${
          loading
            ? "animate-pulse bg-amber-400"
            : isConnected
            ? "bg-emerald-500"
            : "bg-rose-400"
        }`}
      />
      <span className="text-[10px] tracking-tight">
        {loading ? (
          "Checking API..."
        ) : isConnected ? (
          <>
            <span className="font-semibold text-neutral-900">API</span> Connected{" "}
            <span className="text-neutral-400">• MongoDB</span>
          </>
        ) : (
          <button
            type="button"
            onClick={fetchHealth}
            className="text-rose-600 hover:underline"
          >
            Server Offline (Retry)
          </button>
        )}
      </span>
    </div>
  );
}
