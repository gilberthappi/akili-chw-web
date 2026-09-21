import React from "react";
import { AuthDecorativePanel } from "@/components/auth/AuthDecorativePanel";
import { AuthThemeToggle } from "@/components/auth/AuthThemeToggle";

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Max width of the form column content */
  maxWidthClass?: string;
  /** Vertically center content (login) vs top-align scroll (signup) */
  centered?: boolean;
}

/**
 * Shared auth shell — light by default, dark via `dark:` + ThemeProvider.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  maxWidthClass = "max-w-[480px]",
  centered = true,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 lg:p-3 relative bg-[#EFF1F8] dark:bg-[#0e0a1f]">
      <div
        className="w-full min-h-screen lg:min-h-0 lg:h-[calc(100vh-24px)] flex overflow-hidden bg-white dark:bg-[#111827]
          shadow-[0_24px_60px_rgba(15,23,42,0.08),0_0_0_1px_rgba(51,99,173,0.08)]
          dark:shadow-[0_40px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(51,99,173,0.12)]"
        style={{
          borderRadius: "clamp(0px, (100vw - 768px) * 9999, 18px)",
        }}
      >
        <AuthDecorativePanel />

        <div
          className={`flex-1 overflow-y-auto px-6 py-10 relative bg-white dark:bg-[#111827] ${
            centered
              ? "flex flex-col items-center justify-center"
              : ""
          }`}
        >
          {/* Theme toggle — top right of form panel */}
          <div className="absolute top-4 right-4 z-10">
            <AuthThemeToggle />
          </div>

          {/* Brand (mobile only) */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <img
              src="/chw.png"
              alt="eBumenyi"
              className="w-7 h-7 object-contain"
            />
            <span className="text-gray-900 dark:text-white font-bold text-sm">
              eBumenyi
            </span>
          </div>

          <div
            className={`w-full ${maxWidthClass} ${centered ? "" : "mx-auto"}`}
          >
            {children}
          </div>
        </div>
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-700 whitespace-nowrap">
        © {new Date().getFullYear()} eBumenyi · Ministry of Health, Rwanda
      </p>
    </div>
  );
};
