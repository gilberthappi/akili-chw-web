import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const fieldShell = (error?: string, disabled?: boolean) => {
  if (disabled) {
    return "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed dark:bg-[#161922] dark:border-white/[0.04]";
  }
  if (error) {
    return "border-red-400/60 bg-red-50 dark:border-red-500/50 dark:bg-[#1f1535]";
  }
  return "bg-gray-50 border-gray-200 focus-within:border-[#3363AD]/70 focus-within:bg-white dark:bg-[#1c1f2e] dark:border-white/[0.08] dark:focus-within:border-[#3363AD]/70 dark:focus-within:bg-[#1c1f2e]";
};

export const AuthField: React.FC<{
  label: string;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reg: any;
  disabled?: boolean;
  size?: "sm" | "md";
}> = ({
  label,
  placeholder,
  type = "text",
  icon,
  error,
  reg,
  disabled,
  size = "md",
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;
  const pad = size === "sm" ? "px-4 py-3" : "px-4 py-3.5";
  const text = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 border rounded-xl ${pad} transition-colors ${fieldShell(error, disabled)}`}
      >
        <span
          className={`flex-shrink-0 ${error ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}
        >
          {icon}
        </span>
        <input
          {...reg}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 bg-transparent text-gray-900 dark:text-white ${text} placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none min-w-0 disabled:cursor-not-allowed`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            {show ? <EyeOff size={size === "sm" ? 16 : 18} /> : <Eye size={size === "sm" ? 16 : 18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 pl-1">
          {error}
        </p>
      )}
    </div>
  );
};

export const AuthSelect: React.FC<{
  label: string;
  icon: React.ReactNode;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reg: any;
  options: { value: string; label: string }[];
  defaultLabel: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}> = ({ label, icon, error, reg, options, defaultLabel, disabled, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    reg.onChange(e);
    onChange?.(e.target.value);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${fieldShell(error, disabled)}`}
      >
        <span
          className={`flex-shrink-0 ${error ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}
        >
          {icon}
        </span>
        <select
          {...reg}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none min-w-0 disabled:cursor-not-allowed appearance-none
            [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-[#1c1f2e] dark:[&>option]:text-white"
        >
          <option value="" className="text-gray-400">
            {defaultLabel}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 pl-1">{error}</p>
      )}
    </div>
  );
};

export const AuthSectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
    <span className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
    {children}
    <span className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
  </h3>
);
