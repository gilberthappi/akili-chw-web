import { ConversationType } from "@/types";

// The backend defaults User.photo to a generic placeholder silhouette — treat that as
// "no photo" so avatars fall back to colored initials instead of showing the same
// generic icon for every user without a real profile picture.
const DEFAULT_PLACEHOLDER_MARKER = "premium-vector/user-profile-icon";

export const realPhoto = (photo?: string | null): string | undefined =>
  photo && !photo.includes(DEFAULT_PLACEHOLDER_MARKER) ? photo : undefined;

export const conversationAvatarColor: Record<ConversationType, string> = {
  direct: "bg-[#3363AD] text-white",
  group: "bg-green-500 text-white",
  community: "bg-purple-500 text-white",
};

export const conversationBadgeColor: Record<ConversationType, string> = {
  direct: "bg-blue-100 text-blue-800",
  group: "bg-green-100 text-green-800",
  community: "bg-purple-100 text-purple-800",
};
