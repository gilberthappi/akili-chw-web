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
      const title = payload.notification?.title || payload.data?.title || "Notification";
      const body = payload.notification?.body || payload.data?.body || "";
      const type = payload.data?.type;

      // Play a notification sound for foreground notifications
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {}); // silently fail if autoplay blocked
      } catch (_) {}

      if (type === "calendar_reminder") {
        toast(() => (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📅</span>
            <div>
              <strong style={{ display: "block", marginBottom: "2px" }}>{title}</strong>
              <span style={{ fontSize: "13px", color: "#555" }}>{body}</span>
            </div>
          </div>
        ), { duration: 8000 });
      } else {
        toast(() => (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🔔</span>
            <div>
              <strong style={{ display: "block", marginBottom: "2px" }}>{title}</strong>
              {body && <span style={{ fontSize: "13px", color: "#555" }}>{body}</span>}
            </div>
          </div>
        ), { duration: 5000 });
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user]);

  return { token, error };
};

export default usePushNotifications;
