import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthFields";
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
} from "lucide-react";
import { expandRoles, isLearnerRole } from "@/utils/roles";

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
  const effective = expandRoles(roles);
  if ([...effective].some((r) => isLearnerRole(r))) return "/my-learning";
  return "/";
};

// ─── Temporary Issue Screen ──────────────────────────────────────────────────

const TemporaryIssueScreen: React.FC<{
  onCleanup: () => void;
  onRetry: () => void;
}> = ({ onCleanup, onRetry }) => (
  <div className="min-h-screen flex bg-[#EFF1F8] dark:bg-[#0b0f1e] items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 dark:bg-red-500/20 dark:border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Temporary Issue
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Authentication session encountered a problem
        </p>
      </div>

      <div className="bg-white dark:bg-[#151c2e] rounded-2xl border border-gray-200 dark:border-white/10 p-8 space-y-5 shadow-sm">
        <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
            Your session has corrupted cache or storage data. Clear it below to
            resolve the issue.
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

      <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
        © {new Date().getFullYear()} eBumenyi. All rights reserved.
      </p>
    </div>
  </div>
);

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
      <AuthField
        label="Email Address"
        placeholder="you@example.com"
        type="email"
        icon={<Mail size={16} />}
        error={errors.email?.message}
        reg={register("email")}
      />
      <AuthField
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
            className="w-3.5 h-3.5 rounded border-gray-300 bg-white accent-[#3363AD] dark:border-white/20 dark:bg-[#1a2235]"
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
                caches
                  .keys()
                  .then((names) => names.forEach((n) => caches.delete(n)));
              }
              window.location.href = "/auth/login";
            }}
            className="text-[10px] text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors underline"
          >
            Clear Cache
          </button>
          <Link
            to="/auth/forgot-password"
            className="text-xs text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">
            {(mutation.error as { message?: string })?.message ||
              "Invalid credentials. Please try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-[#3363AD] hover:bg-[#2a52a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 text-base rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
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
      <AuthField
        label="National ID (NID)"
        placeholder="16-digit National ID number"
        type="text"
        icon={<CreditCard size={16} />}
        error={errors.nid?.message}
        reg={register("nid")}
      />
      <AuthField
        label="Phone Number"
        placeholder="+250 7XX XXX XXX"
        type="tel"
        icon={<Phone size={16} />}
        error={errors.phoneNumber?.message}
        reg={register("phoneNumber")}
      />

      {mutation.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">
            {(mutation.error as { message?: string })?.message ||
              "Could not verify your details. Please check and try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-[#3363AD] hover:bg-[#2a52a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 text-base rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
      >
        {mutation.isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying…
          </>
        ) : (
          "Sign In"
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
  const [formVisible, setFormVisible] = useState(true);

  const switchMode = (next: LoginMode) => {
    setFormVisible(false);
    setTimeout(() => {
      setMode(next);
      setFormVisible(true);
    }, 250);
  };

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
          signIn({
            token: rawToken,
            expiresIn: 3600,
            authState: user,
            tokenType: "JWT",
          });
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
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
          Welcome back
        </h1>
        <p className="text-base text-gray-500">
          Sign in to continue to eBumenyi
        </p>
      </div>

      <div
        style={{
          opacity: formVisible ? 1 : 0,
          transform: formVisible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        {mode === "staff" ? (
          <StaffLoginForm onSuccess={handleLoginSuccess} />
        ) : (
          <ChwLoginForm onSuccess={handleLoginSuccess} />
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.07]" />
          <span className="text-xs text-gray-400 dark:text-gray-600">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.07]" />
        </div>

        <button
          onClick={() => switchMode(mode === "staff" ? "chw" : "staff")}
          className="mt-4 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border
            border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700
            dark:border-white/[0.10] dark:bg-[#1c1f2e] dark:hover:border-white/25 dark:hover:bg-[#22263a] dark:text-gray-300
            text-sm font-medium transition-all"
        >
          {mode === "staff" ? (
            <>
              <CreditCard size={16} className="text-gray-400" />
              Login with National ID &amp; Phone Number
            </>
          ) : (
            <>
              <Mail size={16} className="text-gray-400" />
              Login with Email &amp; Password
            </>
          )}
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.05] text-center">
        <p className="text-sm text-gray-500 dark:text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/auth/signup"
            className="text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
