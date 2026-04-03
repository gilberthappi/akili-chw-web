/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { Notification } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { getSocketBaseURL } from "@/config/api.config";

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  socket: Socket | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const rawToken = localStorage.getItem("accessToken");

    if (!user || !rawToken) {
      console.warn("[NotificationsContext] No user or token available");
      return;
    }

    // Clean token - remove Bearer prefix if present
    const cleanToken = rawToken.replace(/^Bearer\s+/i, "");
    console.log("[NotificationsContext] Attempting socket connection");

    const socket = io(getSocketBaseURL(), {
      auth: {
        token: cleanToken,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[NotificationsContext] Socket connected with ID:", socket.id);
      setConnected(true);
      // Request initial notifications
      socket.emit("get_notifications");
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[NotificationsContext] Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[NotificationsContext] Socket connection error:", error.message);
      setConnected(false);
    });

    socket.on("connected", (data: any) => {
      console.log("[NotificationsContext] Socket 'connected' event received:", data);
      setConnected(true);
    });

    // Handle new notification
    const handleNewNotification = (notification: Notification) => {
      console.log("[NotificationsContext] New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      // Show toast popup for incoming notifications
      const isReminder = notification.type === "warning" || notification.entityType === "calendar_reminder";
      toast(() => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>
            {isReminder ? "📅" : "🔔"}
          </span>
          <div>
            <strong style={{ display: "block", marginBottom: "2px" }}>
              {notification.title}
            </strong>
            <span style={{ fontSize: "13px", color: "#555" }}>
              {notification.message}
            </span>
          </div>
        </div>
      ),
      { duration: isReminder ? 8000 : 5000 });

      // Play sound
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (_) {}
    };

    socket.on("notification", handleNewNotification);

    socket.on("notifications", (initial: Notification[]) => {
      console.log("[NotificationsContext] Initial notifications loaded:", initial.length);
      setNotifications(initial);
      const unread = initial.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    });

    socket.on("unread_count_updated", (data: { unreadCount: number }) => {
      console.log("[NotificationsContext] Unread count updated:", data.unreadCount);
      // Only update unread count from server if it's a meaningful change
      // (not the initial load which may arrive after we already computed 
      // the correct count from the notifications array)
      setUnreadCount((prev) => {
        // If server says 0 but we have unread notifications in state, trust our state
        if (data.unreadCount === 0 && prev > 0) {
          return prev;
        }
        return data.unreadCount ?? 0;
      });
    });

    socket.on("notification_marked_read", (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === data.notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    });

    socket.on("all_notifications_marked_read", () => {
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
    });

    return () => {
      console.log("[NotificationsContext] Disconnecting socket");
      socket.disconnect();
    };
  }, [user]);

  // Mark a specific notification as read
  const markAsRead = useCallback((notificationId: string) => {
    // Optimistically update local state first
    setNotifications((prev) => {
      const updated = prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      );
      // Recompute unread count from actual state
      setUnreadCount(updated.filter((n) => !n.isRead).length);
      return updated;
    });

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_as_read", { notificationId });
    } else {
      console.warn("[NotificationsContext] Socket not connected, cannot mark notification as read");
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    // Optimistically update local state first
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_all_as_read");
    } else {
      console.warn("[NotificationsContext] Socket not connected, cannot mark all notifications as read");
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback((notificationId: string) => {
    // Optimistically update local state first
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("delete_notification", { notificationId });
    } else {
      console.warn("[NotificationsContext] Socket not connected, cannot delete notification");
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    // Optimistically update local state first
    setNotifications([]);
    setUnreadCount(0);

    // Send to server via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("clear_all_notifications");
    } else {
      console.warn("[NotificationsContext] Socket not connected, cannot clear all notifications");
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        socket: socketRef.current,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotificationsContext must be used within a NotificationsProvider");
  }
  return context;
};
