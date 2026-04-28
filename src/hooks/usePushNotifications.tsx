import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requestFcmToken } from "@/lib/firebase";
import ApiClient from "@/services/api";

export async function registerPushToken(): Promise<"granted" | "denied" | "default" | "error"> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return permission;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const fcmToken = await requestFcmToken(registration);
    if (!fcmToken) return "error";

    await ApiClient.post("/notifications/push-token", { token: fcmToken, platform: "web" });
    return "granted";
  } catch (err) {
    console.error("[PushNotifications] Registration failed", err);
    return "error";
  }
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    // Respect the user's push notification preference
    const pushEnabled = JSON.parse(localStorage.getItem("st_push") ?? "true");
    if (!pushEnabled) return;

    let active = true;

    const register = async () => {
      const result = await registerPushToken();
      if (!active) return;

      if (result === "granted") {
        // Token is registered — nothing more to do here
      } else if (result === "denied") {
        console.warn("[PushNotifications] Permission denied by user");
      } else if (result === "error") {
        setError("Unable to get FCM token");
      } else {
        console.warn("[PushNotifications] Permission not granted:", result);
      }
    };

    register();

    return () => {
      active = false;
    };
  }, [user]);

  return { token, error };
};

export default usePushNotifications;
