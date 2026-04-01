import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthDecorativePanel } from "@/components/auth/AuthDecorativePanel";
import { login } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { useSignIn } from "react-auth-kit";
import { useMutation } from "@tanstack/react-query";
import { ILoginFormData } from "@/types/auth";
import { LoginSchema } from "@/schemas/auth.schema";
import PasswordField from "@/components/common/form/PasswordField";
import Button from "@/components/common/form/Button";
import TextField from "@/components/common/form/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, Lock, AlertCircle, Trash2 } from "lucide-react";

// Helper function to clear invalid tokens
const clearInvalidTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.clear();
  document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "auth-kit-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Bounce detection key
const BOUNCE_COUNT_KEY = "login_bounce_count";
const BOUNCE_TIMESTAMP_KEY = "login_bounce_timestamp";
const MAX_BOUNCES = 3;
const BOUNCE_RESET_TIME = 10000; // 10 seconds

const incrementBounceCount = (): number => {
  const now = Date.now();
  const lastBounce = parseInt(localStorage.getItem(BOUNCE_TIMESTAMP_KEY) || "0");
  
  // Reset if more than 10 seconds have passed
  if (now - lastBounce > BOUNCE_RESET_TIME) {
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

// Temporary Issue Component
const TemporaryIssueScreen: React.FC<{
  onCleanup: () => void;
  onRetry: () => void;
}> = ({ onCleanup, onRetry }) => {
  const handleCleanup = () => {
    clearInvalidTokens();
    resetBounceCount();
    // Clear browser cache
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    onCleanup();
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#3363AD]/10 via-white to-[#3363AD]/5">
      <AuthDecorativePanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Temporary Issue
            </h1>
            <p className="text-gray-600">
              We encountered a temporary authentication issue
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Your authentication session encountered an issue. This usually happens due to corrupted cache or storage data. 
                Please clean your browser cache and local storage to resolve this issue.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCleanup}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
                Clean Cache & Storage
              </button>

              <button
                onClick={onRetry}
                className="w-full bg-[#3363AD] hover:bg-[#2a509a] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>What this does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Clears all browser cache data</li>
                  <li>Removes stored authentication tokens</li>
                  <li>Clears all local storage data</li>
                  <li>Removes authentication cookies</li>
                </ul>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} eBumenyi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const { user, loading } = useAuth();
  const validationAttemptedRef = useRef(false);
  const [showTempIssue, setShowTempIssue] = useState(false);

  // Move hooks to top level - they must be called unconditionally
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ILoginFormData>({
    resolver: zodResolver(LoginSchema),
  });
  const loginMutation = useMutation(login);

  useEffect(() => {
    // Prevent multiple validation attempts
    if (validationAttemptedRef.current || loading) return;

    if (user) {
      validationAttemptedRef.current = true;
      const bounceCount = incrementBounceCount();

      // If bounced 3 times, show cleanup page
      if (bounceCount >= MAX_BOUNCES) {
        setShowTempIssue(true);
        return;
      }

      // Check if there's a token
      const rawToken = localStorage.getItem("accessToken");
      if (rawToken && signIn) {
        try {
          signIn({
            token: rawToken,
            expiresIn: 3600,
            authState: user,
            tokenType: "JWT",
          });

          type RolesHolder = { roles?: string | string[] };
          const rolesValue = (user as unknown as RolesHolder).roles;
          const rolesArray: string[] = rolesValue
            ? Array.isArray(rolesValue)
              ? rolesValue
              : [rolesValue]
            : [];

          if (rolesArray.length > 0) {
            resetBounceCount();
            navigate("/", { replace: true });
          }
        } catch (err) {
          console.warn("Failed to restore react-auth-kit session:", err);
        }
      }
    }
  }, [loading, user, navigate, signIn]);

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

  const submitLoginData = async (data: ILoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess(response) {
        const { token, roles = [], industry, ...authState } = response;
        signIn({
          token: token,
          expiresIn: 3600,
          authState: { ...authState, roles, industry },
          tokenType: "JWT",
        });

        localStorage.setItem("accessToken", token);
          navigate("/", { replace: true });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#3363AD]/10 via-white to-[#3363AD]/5">
      <AuthDecorativePanel />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white text-white">
              <img
                src='/chw.png'
                alt='eBumenyi'
                className='w-40 h-40 object-contain'
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue on eBuzima
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
           <form onSubmit={handleSubmit(submitLoginData)} className='space-y-4'>
            <div>
                  <TextField
                    error={errors.email?.message}
                    type='email'
                    label='Email Address'
                    placeholder="Enter your email"
                    register={register("email")}
                    icon={<Mail size={20} />}
                  />
                </div>

                <div className='space-y-1'>
                  <PasswordField
                    label='Password'
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    icon={<Lock size={20} />}
                    {...register("password", {
                      onChange: (e) => {
                        setValue("password", e.target.value);
                      },
                    })}
                  />
                </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#3363AD] border-gray-300 rounded focus:ring-[#3363AD]"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearInvalidTokens();
                    resetBounceCount();
                    if ("caches" in window) {
                      caches.keys().then((names) => {
                        names.forEach((name) => {
                          caches.delete(name);
                        });
                      });
                    }
                    window.location.href = "/auth/login";
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors underline"
                >
                  Clear Cache
                </button>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-[#3363AD] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

           <div className='pt-2'>
                  <Button
                    label='Sign in'
                    isLoading={loginMutation.isPending}
                    className='hover:bg-primary focus:ring-primary bg-primary w-full py-3 rounded-lg'
                  />
                </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="text-[#3363AD] font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © {new Date().getFullYear()} eBumenyi. All rights reserved.
        </p>
        </div>
      </div>
    </div>
  );
};
