import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Monitor,
  Smartphone,
  Mail,
  Phone,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ChevronRight,
  Moon,
  Sun,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getProfile, updateAvatar } from "@/services/profile.api";
import api from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { registerPushToken } from "@/hooks/usePushNotifications";
import { getSettings, updateSettings, type UpdateSettingsPayload, type NotificationCategories } from "@/services/settings.api";

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullNames: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().min(9, "Invalid phone number"),
  district: z.string().optional().default(""),
  sector: z.string().optional().default(""),
  cell: z.string().optional().default(""),
  village: z.string().optional().default(""),
  gender: z.string().optional(),
  NID: z.string().optional(),
  birthdate: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Small helpers ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400";
const errCls = "text-xs text-red-500 mt-1";

// ── Component ─────────────────────────────────────────────────────────────────

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Theme from context (reactive, applies dark class to <html>)
  const { theme, setTheme } = useTheme();

  // Preferences — seeded from localStorage for instant paint, overridden when API loads
  const [emailNotif, setEmailNotif] = useState(() => JSON.parse(localStorage.getItem("st_email") ?? "true"));
  const [pushNotif, setPushNotif] = useState(() => JSON.parse(localStorage.getItem("st_push") ?? "true"));
  const [smsNotif, setSmsNotif] = useState(() => JSON.parse(localStorage.getItem("st_sms") ?? "false"));
  const [language, setLanguage] = useState(() => localStorage.getItem("st_lang") ?? "en");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("st_tz") ?? "Africa/Kigali");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("st_datefmt") ?? "DD/MM/YYYY");
  const [categories, setCategories] = useState<NotificationCategories>(() => {
    const stored = localStorage.getItem("st_notif_categories");
    return stored
      ? JSON.parse(stored)
      : { courseUpdates: true, assignmentReminders: true, certificates: true, systemUpdates: false };
  });

  // ── Load settings from API ──────────────────────────────────────────────────

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000,
  });

  // When API settings arrive, sync all local state + localStorage
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    setTheme(s.theme as "light" | "dark" | "auto");
    setEmailNotif(s.emailNotif);
    setPushNotif(s.pushNotif);
    setSmsNotif(s.smsNotif);
    setLanguage(s.language);
    setTimezone(s.timezone);
    setDateFormat(s.dateFormat);
    setCategories(s.categories);
    // Keep localStorage in sync as cache
    localStorage.setItem("st_theme", s.theme);
    localStorage.setItem("st_email", JSON.stringify(s.emailNotif));
    localStorage.setItem("st_push", JSON.stringify(s.pushNotif));
    localStorage.setItem("st_sms", JSON.stringify(s.smsNotif));
    localStorage.setItem("st_lang", s.language);
    localStorage.setItem("st_tz", s.timezone);
    localStorage.setItem("st_datefmt", s.dateFormat);
    localStorage.setItem("st_notif_categories", JSON.stringify(s.categories));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData]);

  // ── Save settings to API ────────────────────────────────────────────────────

  const settingsMut = useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userSettings"] }),
    onError: () => toast.error("Failed to save setting"),
  });

  const saveSetting = (payload: UpdateSettingsPayload) => settingsMut.mutate(payload);

  // ── Notification categories helpers ─────────────────────────────────────────

  const toggleCategory = (key: keyof NotificationCategories) => {
    const next = { ...categories, [key]: !categories[key] };
    setCategories(next);
    localStorage.setItem("st_notif_categories", JSON.stringify(next));
    saveSetting({ categories: next });
  };

  // ── Browser push permission status (live) ───────────────────────────────────

  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    () => (typeof Notification !== "undefined" ? Notification.permission : "default"),
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const id = setInterval(() => setPushPermission(Notification.permission), 3000);
    return () => clearInterval(id);
  }, []);

  const [pushLoading, setPushLoading] = useState(false);

  const handlePushToggle = async (enabled: boolean) => {
    if (!enabled) {
      setPushNotif(false);
      localStorage.setItem("st_push", "false");
      saveSetting({ pushNotif: false });
      toast("Push notifications disabled.", { icon: "ℹ️" });
      return;
    }
    if (pushPermission === "denied") {
      toast.error("Push notifications are blocked by your browser. Open browser settings to allow them.");
      return;
    }
    setPushLoading(true);
    const result = await registerPushToken();
    setPushLoading(false);
    setPushPermission(Notification.permission);
    if (result === "granted") {
      setPushNotif(true);
      localStorage.setItem("st_push", "true");
      saveSetting({ pushNotif: true });
      toast.success("Push notifications enabled!");
    } else if (result === "denied") {
      toast.error("Push notifications blocked. Enable them in your browser settings.");
    } else {
      toast.error("Could not enable push notifications. Try again later.");
    }
  };

  // ── Profile query ───────────────────────────────────────────────────────────

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = (profileRes as any)?.data;

  // ── Profile form ────────────────────────────────────────────────────────────

  const {
    register: rp,
    handleSubmit: hsp,
    formState: { errors: ep },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          fullNames: profile.fullNames ?? "",
          email: profile.email ?? "",
          phoneNumber: profile.phoneNumber ?? "",
          district: profile.district ?? "",
          sector: profile.sector ?? "",
          cell: profile.cell ?? "",
          village: profile.village ?? "",
          gender: profile.gender ?? "",
          NID: profile.NID ?? "",
          birthdate: profile.birthdate?.substring(0, 10) ?? "",
        }
      : undefined,
  });

  const profileMut = useMutation({
    mutationFn: (data: ProfileFormData) => api.put("/auth/profile", data),
    onSuccess: (res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = (res.data as any)?.data;
      if (updated) {
        const stored = JSON.parse(localStorage.getItem("chw") ?? "{}");
        localStorage.setItem("chw", JSON.stringify({ ...stored, ...updated }));
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      resetProfile();
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  // ── Password form ───────────────────────────────────────────────────────────

  const {
    register: rpw,
    handleSubmit: hspw,
    formState: { errors: epw },
    reset: resetPw,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const passwordMut = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put("/auth/update-password", data),
    onSuccess: () => {
      toast.success("Password changed successfully");
      resetPw();
    },
    onError: (e: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((e as any)?.response?.data?.message ?? "Failed to change password");
    },
  });

  // ── Avatar upload ───────────────────────────────────────────────────────────

  const avatarMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("photo", file);
      return updateAvatar(fd);
    },
    onSuccess: (res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photo = (res as any)?.data?.photo ?? (res as any)?.photo;
      if (photo) {
        const stored = JSON.parse(localStorage.getItem("chw") ?? "{}");
        localStorage.setItem("chw", JSON.stringify({ ...stored, photo }));
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Photo updated");
    },
    onError: () => toast.error("Failed to upload photo"),
  });

  // ── Tabs ────────────────────────────────────────────────────────────────────

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "language", label: "Language & Region", icon: Globe },
    { id: "data", label: "Data & Storage", icon: Download },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-card-bg rounded-lg shadow p-4">
            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400"
                      : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-card-bg rounded-lg shadow">

            {/* ── PROFILE ────────────────────────────────────────────────── */}
            {activeTab === "profile" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-700">
                  <User className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Profile Settings</h2>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <form onSubmit={hsp((data) => profileMut.mutate(data))}>
                    {/* Avatar */}
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Profile Photo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {profile?.photo ? (
                            <img
                              src={profile.photo}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {profile?.fullNames?.[0]?.toUpperCase() ?? "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              avatarMut.mutate(e.target.files[0])
                            }
                          />
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={avatarMut.isPending}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-300 text-sm disabled:opacity-50"
                          >
                            {avatarMut.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                            Change Photo
                          </button>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            JPG, PNG up to 10 MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personal info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Full Name *
                        </label>
                        <input {...rp("fullNames")} className={inputCls} />
                        {ep.fullNames && (
                          <p className={errCls}>{ep.fullNames.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Email
                        </label>
                        <input {...rp("email")} type="email" className={inputCls} />
                        {ep.email && (
                          <p className={errCls}>{ep.email.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Phone Number *
                        </label>
                        <input {...rp("phoneNumber")} type="tel" className={inputCls} />
                        {ep.phoneNumber && (
                          <p className={errCls}>{ep.phoneNumber.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Gender
                        </label>
                        <select {...rp("gender")} className={inputCls}>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Date of Birth
                        </label>
                        <input
                          {...rp("birthdate")}
                          type="date"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          National ID (NID)
                        </label>
                        <input
                          {...rp("NID")}
                          className={inputCls}
                          placeholder="National ID number"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Location
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(
                          [
                            { name: "district", label: "District" },
                            { name: "sector", label: "Sector" },
                            { name: "cell", label: "Cell" },
                            { name: "village", label: "Village" },
                          ] as const
                        ).map(({ name, label }) => (
                          <div key={name}>
                            <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
                              {label}
                            </label>
                            <input
                              {...rp(name)}
                              className={inputCls}
                              placeholder={label}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                      <button
                        type="submit"
                        disabled={profileMut.isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {profileMut.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ──────────────────────────────────────────── */}
            {activeTab === "notifications" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-700">
                  <Bell className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Notification Preferences
                  </h2>
                </div>

                {/* ── Delivery channels ── */}
                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Email Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Receive updates via email</p>
                      </div>
                    </div>
                    <Toggle
                      checked={emailNotif}
                      onChange={(v) => {
                        setEmailNotif(v);
                        localStorage.setItem("st_email", JSON.stringify(v));
                        saveSetting({ emailNotif: v });
                        toast.success(v ? "Email notifications enabled" : "Email notifications disabled");
                      }}
                    />
                  </div>

                  {/* Push — with live browser permission badge */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Push Notifications</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Browser and device push alerts</p>
                        </div>
                      </div>
                      {pushLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : (
                        <Toggle checked={pushNotif} onChange={handlePushToggle} />
                      )}
                    </div>

                    {/* Permission status banner */}
                    <div className="mt-3 flex items-center gap-2">
                      {pushPermission === "granted" && (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-600 dark:text-green-400">Browser permission granted</span>
                        </>
                      )}
                      {pushPermission === "denied" && (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Blocked by browser — open browser settings to allow
                          </span>
                        </>
                      )}
                      {pushPermission === "default" && (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Permission not yet requested — enable the toggle to ask
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* SMS */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">SMS Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Text message alerts</p>
                      </div>
                    </div>
                    <Toggle
                      checked={smsNotif}
                      onChange={(v) => {
                        setSmsNotif(v);
                        localStorage.setItem("st_sms", JSON.stringify(v));
                        saveSetting({ smsNotif: v });
                        toast.success(v ? "SMS notifications enabled" : "SMS notifications disabled");
                      }}
                    />
                  </div>
                </div>

                {/* ── Notification categories ── */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
                    Notification Categories
                  </h3>
                  <div className="space-y-1 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    {(
                      [
                        { key: "courseUpdates",        label: "Course Updates",        desc: "New courses and content updates" },
                        { key: "assignmentReminders",  label: "Assignment Reminders",  desc: "Deadline and submission reminders" },
                        { key: "certificates",         label: "Certificates",          desc: "Certificate completion notifications" },
                        { key: "systemUpdates",        label: "System Updates",        desc: "Platform maintenance and updates" },
                      ] as const
                    ).map(({ key, label, desc }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 border-b border-gray-100 dark:border-slate-700 last:border-0 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{label}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={categories[key]}
                          onChange={() => toggleCategory(key)}
                          className="w-4 h-4 text-blue-600 rounded accent-blue-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ───────────────────────────────────────────────── */}
            {activeTab === "security" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-700">
                  <Shield className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Security & Privacy
                  </h2>
                </div>

                <form
                  onSubmit={hspw((data) =>
                    passwordMut.mutate({
                      currentPassword: data.currentPassword,
                      newPassword: data.newPassword,
                    }),
                  )}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 mb-6"
                >
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          {...rpw("currentPassword")}
                          type={showCurrent ? "text" : "password"}
                          className={`${inputCls} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-500"
                        >
                          {showCurrent ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {epw.currentPassword && (
                        <p className={errCls}>{epw.currentPassword.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            {...rpw("newPassword")}
                            type={showNew ? "text" : "password"}
                            className={`${inputCls} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-500"
                          >
                            {showNew ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {epw.newPassword && (
                          <p className={errCls}>{epw.newPassword.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            {...rpw("confirmPassword")}
                            type={showConfirm ? "text" : "password"}
                            className={`${inputCls} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-500"
                          >
                            {showConfirm ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {epw.confirmPassword && (
                          <p className={errCls}>{epw.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordMut.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {passwordMut.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Update Password
                    </button>
                  </div>
                </form>

                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-4">
                    Active Sessions
                  </h3>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          Current Browser
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Active now</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">
                      Current Session
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── APPEARANCE ─────────────────────────────────────────────── */}
            {activeTab === "appearance" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-700">
                  <Palette className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Appearance
                  </h2>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
                    Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(
                      [
                        { value: "light", label: "Light", icon: Sun, preview: "bg-white border" },
                        { value: "dark", label: "Dark", icon: Moon, preview: "bg-gray-800" },
                        { value: "auto", label: "Auto", icon: Monitor, preview: "bg-gradient-to-r from-white to-gray-800" },
                      ] as const
                    ).map(({ value, label, icon: Icon, preview }) => (
                      <button
                        key={value}
                        onClick={() => { setTheme(value); saveSetting({ theme: value }); }}
                        className={`border-2 rounded-lg p-4 text-left transition-colors ${
                          theme === value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 dark:text-slate-300" />
                          <span className="text-sm font-medium dark:text-slate-300">{label}</span>
                        </div>
                        <div className={`w-full h-12 ${preview} rounded`} />
                      </button>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">
                    {theme === "auto"
                      ? "Theme follows your system preference."
                      : theme === "dark"
                      ? "Dark theme is active."
                      : "Light theme is active."}
                  </p>
                </div>
              </div>
            )}

            {/* ── LANGUAGE ───────────────────────────────────────────────── */}
            {activeTab === "language" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-700">
                  <Globe className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Language & Region
                  </h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        localStorage.setItem("st_lang", e.target.value);
                        saveSetting({ language: e.target.value });
                      }}
                      className={inputCls}
                    >
                      <option value="en">English</option>
                      <option value="rw">Kinyarwanda</option>
                      <option value="fr">Français</option>
                      <option value="sw">Kiswahili</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Time Zone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        localStorage.setItem("st_tz", e.target.value);
                        saveSetting({ timezone: e.target.value });
                      }}
                      className={inputCls}
                    >
                      <option value="Africa/Kigali">(UTC+02:00) Africa/Kigali</option>
                      <option value="UTC">(UTC+00:00) UTC</option>
                      <option value="Europe/London">(UTC+00:00) Europe/London</option>
                      <option value="America/New_York">(UTC-05:00) America/New_York</option>
                      <option value="Asia/Tokyo">(UTC+09:00) Asia/Tokyo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Date Format
                    </label>
                    <select
                      className={inputCls}
                      value={dateFormat}
                      onChange={(e) => {
                        setDateFormat(e.target.value);
                        localStorage.setItem("st_datefmt", e.target.value);
                        saveSetting({ dateFormat: e.target.value });
                      }}
                    >
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── DATA & STORAGE ─────────────────────────────────────────── */}
            {activeTab === "data" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-700">
                  <Download className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Data & Storage
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2">
                      Clear Cache
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      Remove locally cached preferences to free up storage.
                    </p>
                    <button
                      onClick={() => {
                        ["st_email", "st_push", "st_sms", "st_theme", "st_lang", "st_tz"].forEach((k) =>
                          localStorage.removeItem(k),
                        );
                        toast.success("Cache cleared");
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-300 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear Cache
                    </button>
                  </div>

                  <div className="border border-red-200 dark:border-red-900/50 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <h3 className="font-medium text-red-900 dark:text-red-400 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400/80 mb-3">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                    <button
                      onClick={() =>
                        toast.error(
                          "Please contact an administrator to delete your account",
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
