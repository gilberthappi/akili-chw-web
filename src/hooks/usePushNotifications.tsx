import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requestFcmToken } from "@/lib/firebase";
import ApiClient from "@/services/api";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    let active = true;

    const register = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "denied") {
          // Silently fail — user explicitly blocked notifications
          console.warn("[PushNotifications] Permission denied by user");
          return;
        }
        if (permission !== "granted") {
          console.warn("[PushNotifications] Permission not granted:", permission);
          return;
        }

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

        const fcmToken = await requestFcmToken(registration);
        if (!fcmToken) {
          setError("Unable to get FCM token");
          return;
        }

        if (!active) return;
        setToken(fcmToken);

        await ApiClient.post("/notifications/push-token", {
          token: fcmToken,
          platform: "web",
        });
      } catch (err: any) {
        console.error("Push registration failed", err);
        setError(err?.message || "Push registration failed");
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
