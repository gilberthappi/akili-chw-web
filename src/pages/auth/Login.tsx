import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthDecorativePanel } from "@/components/auth/AuthDecorativePanel";
import { login, loginStudent } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { useSignIn } from "react-auth-kit";
import { useMutation } from "@tanstack/react-query";
import { ILoginFormData, IStudentLoginFormData } from "@/types/auth";
import { LoginSchema, StudentLoginSchema } from "@/schemas/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Mail,
  Lock,
  AlertCircle,
  Trash2,
  Phone,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";

// ─── Auth helpers ────────────────────────────────────────────────────────────

const clearInvalidTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.clear();
  ["accessToken", "token", "auth-kit-token"].forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};

const BOUNCE_COUNT_KEY = "login_bounce_count";
const BOUNCE_TIMESTAMP_KEY = "login_bounce_timestamp";
const MAX_BOUNCES = 3;
const BOUNCE_RESET_TIME = 10_000;

const incrementBounceCount = (): number => {
  const now = Date.now();
  const last = parseInt(localStorage.getItem(BOUNCE_TIMESTAMP_KEY) || "0");
  if (now - last > BOUNCE_RESET_TIME) {
    localStorage.setItem(BOUNCE_COUNT_KEY, "1");
    localStorage.setItem(BOUNCE_TIMESTAMP_KEY, now.toString());
    return 1;
  }
  const count = parseInt(localStorage.getItem(BOUNCE_COUNT_KEY) || "0") + 1;
  localStorage.setItem(BOUNCE_COUNT_KEY, count.toString());
  localStorage.setItem(BOUNCE_TIMESTAMP_KEY, now.toString());
  return count;
};

const resetBounceCount = () => {
  localStorage.removeItem(BOUNCE_COUNT_KEY);
  localStorage.removeItem(BOUNCE_TIMESTAMP_KEY);
};

const getRoleRedirect = (roles: string[]): string => {
  if (roles.some((r) => ["TRAINEE"].includes(r))) return "/my-learning";
  return "/";
};

// ─── Temporary Issue Screen ──────────────────────────────────────────────────

const TemporaryIssueScreen: React.FC<{
  onCleanup: () => void;
  onRetry: () => void;
}> = ({ onCleanup, onRetry }) => (
  <div className="min-h-screen flex bg-[#0b0f1e] items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Temporary Issue</h1>
        <p className="text-gray-400 text-sm">Authentication session encountered a problem</p>
      </div>

      <div className="bg-[#151c2e] rounded-2xl border border-white/10 p-8 space-y-5">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-300 leading-relaxed">
            Your session has corrupted cache or storage data. Clear it below to resolve the issue.
          </p>
        </div>

        <button
          onClick={() => {
            clearInvalidTokens();
            resetBounceCount();
            if ("caches" in window) {
              caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
            }
            onCleanup();
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Trash2 size={18} /> Clean Cache & Storage
        </button>

        <button
          onClick={onRetry}
          className="w-full bg-[#3363AD] hover:bg-[#2a52a0] text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          Back to Login
        </button>
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        © {new Date().getFullYear()} eBumenyi. All rights reserved.
      </p>
    </div>
  </div>
);

// ─── Shared input component (dark-themed) ────────────────────────────────────

interface DarkInputProps {
  label: string;
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  error?: string;
  registration: ReturnType<typeof useForm>["register"] extends (name: string, ...args: unknown[]) => infer R ? R : never;
}

const DarkField: React.FC<{
  label: string;
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reg: any;
}> = ({ label, placeholder, type = "text", icon, error, reg }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 bg-[#1a2235] border rounded-xl px-4 py-3 transition-colors ${
          error ? "border-red-500/50" : "border-white/10 focus-within:border-[#3363AD]/60"
        }`}
      >
        <span className={`flex-shrink-0 ${error ? "text-red-400" : "text-gray-500"}`}>
          {icon}
        </span>
        <input
          {...reg}
          type={inputType}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none min-w-0"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
};

// ─── Staff Login Form ─────────────────────────────────────────────────────────

const StaffLoginForm: React.FC<{
  onSuccess: (token: string, roles: string[], authState: object) => void;
}> = ({ onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginFormData>({ resolver: zodResolver(LoginSchema) });

  const mutation = useMutation(login);

  const onSubmit = (data: ILoginFormData) => {
    mutation.mutate(data, {
      onSuccess(response) {
        const { token, roles = [], ...rest } = response;
        onSuccess(token, Array.isArray(roles) ? roles : [roles], { ...rest, roles });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DarkField
        label="Email Address"
        placeholder="you@example.com"
        type="email"
        icon={<Mail size={16} />}
        error={errors.email?.message}
        reg={register("email")}
      />
      <DarkField
        label="Password"
        placeholder="Enter your password"
        type="password"
        icon={<Lock size={16} />}
        error={errors.password?.message}
        reg={register("password")}
      />

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-white/20 bg-[#1a2235] accent-[#3363AD]"
          />
          <span className="text-xs text-gray-500">Remember me</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              clearInvalidTokens();
              resetBounceCount();
              if ("caches" in window) {
                caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
              }
              window.location.href = "/auth/login";
            }}
            className="text-[10px] text-gray-600 hover:text-red-400 transition-colors underline"
          >
            Clear Cache
          </button>
          <Link
            to="/auth/forgot-password"
            className="text-xs text-[#4a90d9] hover:text-[#6aaae8] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            {(mutation.error as { message?: string })?.message ||
              "Invalid credentials. Please try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-[#3363AD] hover:bg-[#2a52a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
      >
        {mutation.isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
};

// ─── CHW Login Form ───────────────────────────────────────────────────────────

const ChwLoginForm: React.FC<{
  onSuccess: (token: string, roles: string[], authState: object) => void;
}> = ({ onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IStudentLoginFormData>({ resolver: zodResolver(StudentLoginSchema) });

  const mutation = useMutation(loginStudent);

  const onSubmit = (data: IStudentLoginFormData) => {
    mutation.mutate(data, {
      onSuccess(response) {
        const { token, roles = [], ...rest } = response;
        onSuccess(token, Array.isArray(roles) ? roles : [roles], { ...rest, roles });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DarkField
        label="National ID (NID)"
        placeholder="16-digit National ID number"
        type="text"
        icon={<CreditCard size={16} />}
        error={errors.nid?.message}
        reg={register("nid")}
      />
      <DarkField
        label="Phone Number"
        placeholder="+250 7XX XXX XXX"
        type="tel"
        icon={<Phone size={16} />}
        error={errors.phoneNumber?.message}
        reg={register("phoneNumber")}
      />

      {mutation.isError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            {(mutation.error as { message?: string })?.message ||
              "Could not verify your details. Please check and try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-[#3363AD] hover:bg-[#2a52a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
      >
        {mutation.isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying…
          </>
        ) : (
          "Sign In as CHW"
        )}
      </button>
    </form>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────

type LoginMode = "staff" | "chw";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const { user, loading } = useAuth();
  const validationAttemptedRef = useRef(false);
  const [showTempIssue, setShowTempIssue] = useState(false);
  const [mode, setMode] = useState<LoginMode>("staff");

  useEffect(() => {
    if (validationAttemptedRef.current || loading) return;
    if (user) {
      validationAttemptedRef.current = true;
      const bounceCount = incrementBounceCount();
      if (bounceCount >= MAX_BOUNCES) {
        setShowTempIssue(true);
        return;
      }
      const rawToken = localStorage.getItem("accessToken");
      if (rawToken && signIn) {
        try {
          signIn({ token: rawToken, expiresIn: 3600, authState: user, tokenType: "JWT" });
          type R = { roles?: string | string[] };
          const rv = (user as unknown as R).roles;
          const roles: string[] = rv ? (Array.isArray(rv) ? rv : [rv]) : [];
          if (roles.length > 0) {
            resetBounceCount();
            navigate(getRoleRedirect(roles), { replace: true });
          }
        } catch {
          // session restore failed, stay on login
        }
      }
    }
  }, [loading, user, navigate, signIn]);

  const handleLoginSuccess = (token: string, roles: string[], authState: object) => {
    signIn({ token, expiresIn: 3600, authState, tokenType: "JWT" });
    localStorage.setItem("accessToken", token);
    resetBounceCount();
    navigate(getRoleRedirect(roles), { replace: true });
  };

  if (showTempIssue) {
    return (
      <TemporaryIssueScreen
        onCleanup={() => {
          setShowTempIssue(false);
          validationAttemptedRef.current = false;
        }}
        onRetry={() => {
          setShowTempIssue(false);
          validationAttemptedRef.current = false;
          window.location.href = "/auth/login";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1e] flex items-center justify-center p-4 lg:p-6">
      {/* Card */}
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex min-h-[600px] border border-white/5">
        {/* Left decorative panel */}
        <AuthDecorativePanel />

        {/* Right — login form */}
        <div className="w-full lg:w-1/2 bg-[#0f1520] flex flex-col justify-center px-8 py-10 lg:px-12">
          {/* Brand (visible on mobile when panel is hidden) */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <img src="/chw.png" alt="eBumenyi" className="w-8 h-8 object-contain" />
            <span className="text-white font-bold text-base">eBumenyi</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">
              Sign in to continue to eBumenyi
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-7 p-1 bg-[#141b2d] rounded-xl border border-white/5">
            {(
              [
                { id: "staff", label: "Staff / Admin", icon: "🏥" },
                { id: "chw", label: "CHW / Student", icon: "👤" },
              ] as { id: LoginMode; label: string; icon: string }[]
            ).map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === id
                    ? "bg-[#3363AD] text-white shadow-lg shadow-[#3363AD]/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Context hint */}
          <div className="mb-5 px-4 py-2.5 bg-[#3363AD]/10 border border-[#3363AD]/20 rounded-xl">
            {mode === "staff" ? (
              <p className="text-xs text-[#4a90d9]">
                <span className="font-semibold">Staff, Trainers & Admins</span> — use your email address and password.
              </p>
            ) : (
              <p className="text-xs text-[#4a90d9]">
                <span className="font-semibold">Community Health Workers</span> — use your National ID and phone number.
              </p>
            )}
          </div>

          {/* Forms */}
          {mode === "staff" ? (
            <StaffLoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <ChwLoginForm onSuccess={handleLoginSuccess} />
          )}

          {/* Footer links */}
          <div className="mt-7 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="text-[#4a90d9] hover:text-[#6aaae8] font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Page footer */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-700 whitespace-nowrap">
        © {new Date().getFullYear()} eBumenyi · Ministry of Health, Rwanda
      </p>
    </div>
  );
};
