import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTenantConfig } from "../../../config/tenantContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../../app/components/ui/input-otp";
import {
  forgotPassword,
  resendLoginOTP,
  resendRegistrationOTP,
  resetPassword,
  verifyLoginOTP,
  verifyRegistrationOTP,
} from "../../../app/api";
import { AuthModalProps } from "../types";

type AuthView = "auth" | "login-otp" | "signup-otp" | "forgot-email" | "forgot-otp";

export function AuthModal({
  open,
  mode,
  onClose,
  onSubmit,
  onGoogleSignIn,
  onModeChange,
  user,
  onLoginSuccess,
}: AuthModalProps) {
  const { config } = useTenantConfig();
  const [view, setView] = useState<AuthView>("auth");
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: (user as any)?.phone ? String((user as any).phone).replace(/^\+91/, "") : "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isSignup = mode === "signup";

  useEffect(() => {
    if (open) {
      setForm({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: (user as any)?.phone ? String((user as any).phone).replace(/^\+91/, "") : "",
        password: "",
      });
      setError("");
      setSuccessMsg("");
      setView("auth");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setCooldown(0);
    }
  }, [open, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!open) return null;

  // Handlers for Login OTP
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await verifyLoginOTP({ email: otpEmail, otp: otp.trim() });
      const verifiedUser = data.user || {
        email: otpEmail,
        name: otpEmail.split("@")[0],
        role: "user",
      };
      if (onLoginSuccess) {
        onLoginSuccess(verifiedUser);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (cooldown > 0) return;
    setError("");
    setSubmitting(true);
    try {
      await resendLoginOTP(otpEmail);
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Signup OTP
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await verifyRegistrationOTP({ email: otpEmail, otp: otp.trim() });
      const verifiedUser = data.user || {
        email: otpEmail,
        name: form.name.trim() || otpEmail.split("@")[0],
        role: "user",
      };
      if (onLoginSuccess) {
        onLoginSuccess(verifiedUser);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify registration code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (cooldown > 0) return;
    setError("");
    setSubmitting(true);
    try {
      await resendRegistrationOTP(otpEmail);
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Forgot Password
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await forgotPassword(cleanEmail);
      setCooldown(60);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setView("forgot-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await resetPassword({
        email: otpEmail.trim().toLowerCase(),
        otp: otp.trim(),
        password: newPassword,
      });
      setForm((prev) => ({ ...prev, email: otpEmail, password: "" }));
      setSuccessMsg("Password reset successfully! Please log in with your new password.");
      onModeChange("login");
      setView("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[28px] border border-black/10 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] text-neutral-900 dark:text-neutral-100"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-black/45 dark:text-white/45">
                {config.branding.brandName}
              </p>
              <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-black dark:text-white">
                {view === "auth" && (isSignup ? "Create account" : "Welcome back")}
                {view === "login-otp" && "Two-Step Verification"}
                {view === "signup-otp" && "Verify Your Email"}
                {view === "forgot-email" && "Reset Password"}
                {view === "forgot-otp" && "Set New Password"}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close login"
              className="flex h-9 w-9 items-center justify-center border border-black/10 dark:border-neutral-800 text-black dark:text-white transition-colors hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: Default Auth Form (Login / Signup) */}
          {view === "auth" && (
            <>
              <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-black/10 dark:border-neutral-800 bg-[#f5f5f3] dark:bg-neutral-800/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    onModeChange("login");
                  }}
                  className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                    !isSignup ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    onModeChange("signup");
                  }}
                  className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                    isSignup ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError("");
                  setSubmitting(true);
                  try {
                    await onGoogleSignIn();
                  } catch (signInError) {
                    setError(
                      signInError instanceof Error
                        ? signInError.message
                        : "Unable to continue with Google."
                    );
                    setSubmitting(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-3 border border-black/15 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black dark:text-white hover:bg-[#f5f5f3] dark:hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60 transition-colors cursor-pointer"
              >
                <span className="text-base font-semibold normal-case tracking-normal">G</span> Continue
                with Google
              </button>

              <div className="my-5 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-black/35 dark:text-white/35">
                <span className="h-px flex-1 bg-black/10 dark:bg-neutral-800" />
                Or continue with email
                <span className="h-px flex-1 bg-black/10 dark:bg-neutral-800" />
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError("");
                  setSuccessMsg("");

                  if (isSignup) {
                    const digits = form.phone.replace(/\D/g, "");
                    if (!digits || digits.length !== 10) {
                      setError("Please enter a valid 10-digit mobile number.");
                      return;
                    }
                    if (!/^[6-9]/.test(digits)) {
                      setError("Mobile number must start with 6, 7, 8, or 9.");
                      return;
                    }
                  }

                  if (!form.password || form.password.length < 6) {
                    setError("Password must be at least 6 characters.");
                    return;
                  }

                  setSubmitting(true);
                  try {
                    const result = await onSubmit({
                      ...form,
                      name: form.name.trim(),
                      email: form.email.trim(),
                      phone: form.phone.trim() ? `+91${form.phone.replace(/\D/g, "")}` : undefined,
                      password: form.password,
                    });
                    if (result?.requiresOtp) {
                      setOtpEmail(result.email || form.email.trim());
                      setOtp("");
                      setCooldown(60);
                      if (result.isSignup || isSignup) {
                        setView("signup-otp");
                      } else {
                        setView("login-otp");
                      }
                    } else {
                      onClose();
                    }
                  } catch (submitError) {
                    setError(
                      submitError instanceof Error
                        ? submitError.message
                        : "Unable to authenticate. Please try again."
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                {isSignup && (
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                      Full name
                    </span>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="w-full border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 px-4 py-3 text-sm outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      placeholder="Alex Morgan"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 px-4 py-3 text-sm outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    placeholder="hello@knowpollen.com"
                  />
                </label>

                {isSignup && (
                  <div>
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                      Mobile Number <span className="text-red-500">*</span>
                    </span>
                    <div className="flex w-full items-center border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 focus-within:border-black dark:focus-within:border-white transition-colors">
                      <span className="flex items-center px-3.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-black/[0.04] dark:bg-neutral-800 border-r border-black/10 dark:border-neutral-700 py-3 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(event) => {
                          const val = event.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm({ ...form, phone: val });
                        }}
                        className="w-full bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-neutral-900 dark:text-white"
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                      Password
                    </span>
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setSuccessMsg("");
                          setOtpEmail(form.email.trim());
                          setView("forgot-email");
                        }}
                        className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      className="w-full border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 px-4 py-3 pr-10 text-sm outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      placeholder="••••••••"
                    />
                    {form.password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white focus:outline-none transition-colors cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full bg-black dark:bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting
                    ? "Please wait"
                    : isSignup
                    ? "Create account"
                    : "Log in"}
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      const cleanEmail = form.email.trim().toLowerCase();
                      if (!cleanEmail) {
                        setError("Please enter your email address first.");
                        return;
                      }
                      if (isSignup) {
                        const digits = form.phone.replace(/\D/g, "");
                        if (!digits || digits.length !== 10) {
                          setError("Please enter a valid 10-digit mobile number.");
                          return;
                        }
                      }
                      setError("");
                      setSuccessMsg("");
                      setSubmitting(true);
                      try {
                        const result = await onSubmit({
                          name: form.name.trim(),
                          email: cleanEmail,
                          phone: form.phone.trim() ? `+91${form.phone.replace(/\D/g, "")}` : undefined,
                          password: "",
                        });
                        if (result?.requiresOtp) {
                          setOtpEmail(result.email || cleanEmail);
                          setOtp("");
                          setCooldown(60);
                          if (result.isSignup || isSignup) {
                            setView("signup-otp");
                          } else {
                            setView("login-otp");
                          }
                        }
                      } catch (otpErr) {
                        setError(
                          otpErr instanceof Error
                            ? otpErr.message
                            : "Unable to send verification code."
                        );
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {isSignup ? "Sign up with Email OTP instead" : "Log in with Email OTP instead"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: Login OTP Verification */}
          {view === "login-otp" && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-300">
                <ShieldCheck size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <p>
                  We have sent a 6-digit security code to{" "}
                  <strong className="font-semibold text-black dark:text-white">{otpEmail}</strong>.
                  Please enter it below to confirm your login.
                </p>
              </div>

              <form onSubmit={handleVerifyLoginOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    6-Digit Verification Code
                  </label>
                  <div className="flex justify-center py-1">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={submitting}>
                      <InputOTPGroup className="gap-1.5 sm:gap-2 justify-center">
                        <InputOTPSlot index={0} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={1} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={2} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={3} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={4} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={5} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {error && <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || otp.length < 6}
                  className="w-full bg-black dark:bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? "Verifying..." : "Verify & Sign In"}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setView("auth");
                      setError("");
                    }}
                    className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Back to login
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || submitting}
                    onClick={handleResendLoginOtp}
                    className="font-medium text-black dark:text-white disabled:text-neutral-400 dark:disabled:text-neutral-600 hover:underline transition-colors cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: Signup Registration OTP Verification */}
          {view === "signup-otp" && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-300">
                <ShieldCheck size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <p>
                  We have sent a 6-digit verification code to{" "}
                  <strong className="font-semibold text-black dark:text-white">{otpEmail}</strong>.
                  Please enter it below to activate your account.
                </p>
              </div>

              <form onSubmit={handleVerifySignupOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    6-Digit Verification Code
                  </label>
                  <div className="flex justify-center py-1">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={submitting}>
                      <InputOTPGroup className="gap-1.5 sm:gap-2 justify-center">
                        <InputOTPSlot index={0} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={1} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={2} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={3} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={4} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={5} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {error && <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || otp.length < 6}
                  className="w-full bg-black dark:bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? "Activating Account..." : "Verify & Complete Sign Up"}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setView("auth");
                      onModeChange("signup");
                      setError("");
                    }}
                    className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Back to sign up
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || submitting}
                    onClick={handleResendSignupOtp}
                    className="font-medium text-black dark:text-white disabled:text-neutral-400 dark:disabled:text-neutral-600 hover:underline transition-colors cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: Forgot Password - Request Code */}
          {view === "forgot-email" && (
            <div>
              <p className="mb-4 text-xs leading-relaxed text-black/60 dark:text-white/60">
                Enter your account email below. We will send you a 6-digit verification code to reset your password.
              </p>

              <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="w-full border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 px-4 py-3 text-sm outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    placeholder="hello@knowpollen.com"
                  />
                </label>

                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black dark:bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? "Sending Code..." : "Send Verification Code"}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setView("auth");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Back to login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: Forgot Password - Verify OTP & Set New Password */}
          {view === "forgot-otp" && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                <Mail size={18} className="shrink-0 text-neutral-600 dark:text-neutral-400" />
                <p>
                  Reset code sent to <strong className="font-semibold text-black dark:text-white">{otpEmail}</strong>.
                  Enter the code and your new password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="mb-2 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    Verification Code
                  </label>
                  <div className="flex justify-center py-1">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={submitting}>
                      <InputOTPGroup className="gap-1.5 sm:gap-2 justify-center">
                        <InputOTPSlot index={0} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={1} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={2} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={3} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={4} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <InputOTPSlot index={5} className="h-9 w-9 sm:h-11 sm:w-11 text-sm sm:text-base font-bold rounded-lg border-black/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    New Password
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 px-4 py-2.5 pr-10 text-sm outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      placeholder="At least 6 characters"
                    />
                    {newPassword && (
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white focus:outline-none transition-colors cursor-pointer"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                    Confirm Password
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-black/10 dark:border-neutral-700 bg-[#faf9f7] dark:bg-neutral-850 px-4 py-2.5 pr-10 text-sm outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      placeholder="Repeat new password"
                    />
                    {confirmPassword && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white focus:outline-none transition-colors cursor-pointer"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {error && <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || otp.length < 6 || !newPassword}
                  className="w-full bg-black dark:bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? "Resetting Password..." : "Update Password"}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setView("auth");
                      setError("");
                    }}
                    className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Back to login
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || submitting}
                    onClick={async () => {
                      if (cooldown > 0) return;
                      try {
                        await forgotPassword(otpEmail.trim());
                        setCooldown(60);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to resend code.");
                      }
                    }}
                    className="font-medium text-black dark:text-white disabled:text-neutral-400 dark:disabled:text-neutral-600 hover:underline transition-colors cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
