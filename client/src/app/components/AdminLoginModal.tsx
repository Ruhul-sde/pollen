import { Eye, EyeOff, Lock, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { adminLogin } from "../api";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (adminUser: { id: string; name: string; email: string; role: string }) => void;
}

export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState("hammambinasraful@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await adminLogin(email.trim(), password);
      onSuccess(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail("hammambinasraful@gmail.com");
    setPassword("12345678");
    setError("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-[#0d0d0d] p-6 text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400">
                <Lock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
                  Management Access
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">Admin Portal</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-neutral-400">
            Sign in with administrative credentials to access order management, live statistics, and product catalog controls.
          </p>

          {/* Quick Demo Credentials Pill */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
            <div className="text-[11px] text-neutral-300">
              <span className="text-neutral-500 font-mono">Admin:</span> hammambinasraful@gmail.com / 12345678
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="rounded bg-neutral-800 px-2 py-1 text-[10px] font-medium text-amber-400 hover:bg-neutral-700 transition-colors"
            >
              Autofill
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
              <ShieldAlert size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
                placeholder="admin@pollen.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
                  placeholder="••••••••"
                />
                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-white focus:outline-none transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-3 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Authenticating..." : "Enter Dashboard"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
