import { ConversationType } from "@/types";

// The backend defaults User.photo to a generic placeholder silhouette — treat that as
// "no photo" so avatars fall back to colored initials instead of showing the same
// generic icon for every user without a real profile picture.
const DEFAULT_PLACEHOLDER_MARKER = "premium-vector/user-profile-icon";

export const realPhoto = (photo?: string | null): string | undefined =>
  photo && !photo.includes(DEFAULT_PLACEHOLDER_MARKER) ? photo : undefined;

export const conversationAvatarColor: Record<ConversationType, string> = {
  direct: "bg-primary text-white",
  group: "bg-green-500 text-white",
  community: "bg-purple-500 text-white",
};

export const conversationBadgeColor: Record<ConversationType, string> = {
  direct: "bg-blue-100 text-blue-800",
  group: "bg-green-100 text-green-800",
  community: "bg-purple-100 text-purple-800",
};

// Desktop: "3 minutes ago" / "about 2 hours ago"
// Mobile compact: 2s, 4m, 3h, 2d, 3w, 2mo, 1y
export const formatRelativeTime = (
  iso: string,
  options?: { compact?: boolean },
): string => {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (options?.compact) {
    if (seconds < 60) return `${Math.max(seconds, 1)}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (weeks < 5) return `${weeks}w`;
    if (months < 12) return `${Math.max(months, 1)}mo`;
    return `${Math.max(years, 1)}y`;
  }

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `about ${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  if (months < 12) return `${Math.max(months, 1)} month${months === 1 ? "" : "s"} ago`;
  return `${Math.max(years, 1)} year${years === 1 ? "" : "s"} ago`;
};
