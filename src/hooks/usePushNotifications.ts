import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase";
import { getApiBaseURL } from "@/config/api.config";
import toast from "react-hot-toast";

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
        if (permission !== "granted") {
          setError("Notification permission denied");
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

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;
        const cleanToken = accessToken.replace(/^Bearer\s+/i, "");

        await fetch(`${getApiBaseURL()}/notifications/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: cleanToken,
          },
          body: JSON.stringify({ token: fcmToken, platform: "web" }),
        });
      } catch (err: any) {
        console.error("Push registration failed", err);
        setError(err?.message || "Push registration failed");
      }
    };

    register();

    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Notification";
      const body = payload.notification?.body || payload.data?.message;
      toast(title + (body ? `: ${body}` : ""));
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user]);

  return { token, error };
};

export default usePushNotifications;
