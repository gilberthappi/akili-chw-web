import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, AlertCircle, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthFields";
import { forgotPassword } from "@/services/auth.service";
import { ForgotPasswordSchema } from "@/schemas/auth.schema";
import { IResetPasswordRequest } from "@/types/auth";

export const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IResetPasswordRequest>({ resolver: zodResolver(ForgotPasswordSchema) });

  const onSubmit = async (data: IResetPasswordRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {!isSubmitted ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
              Forgot password?
            </h1>
            <p className="text-base text-gray-500">
              No worries, we'll send you reset instructions
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AuthField
              label="Email Address"
              placeholder="you@example.com"
              type="email"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              reg={register("email")}
            />

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3363AD] hover:bg-[#2a52a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 text-base rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-2 text-sm text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] transition-colors mt-4"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 dark:bg-green-500/20 dark:border-green-500/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Check your email
          </h1>
          <p className="text-base text-gray-500 mb-6">
            We've sent a password reset link to
            <br />
            <span className="text-gray-900 dark:text-white font-medium">
              {submittedEmail}
            </span>
          </p>

          <div className="bg-gray-50 border border-gray-200 dark:bg-[#1c1f2e] dark:border-white/[0.08] rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] transition-colors"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};
