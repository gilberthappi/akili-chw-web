import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Repeat2,
  BarChart2,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Send,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { IMessage, ICommentThread } from "@/types";
import { IUser } from "@/types/common";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { realPhoto } from "./avatarStyles";
import { MessageMedia } from "./media/MessageMedia";
import { CommunityComment } from "./CommunityComment";
import {
  togglePostLike,
  toggleSavePost,
  resharePost,
  getPostComments,
  addPostComment,
  editCommunityComment,
  deleteCommunityComment,
  editCommunityPost,
  deleteCommunityPost,
} from "@/services/community.service";
import { normalizeComment } from "@/services/messaging.adapter";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

interface CommunityPostCardProps {
  post: IMessage;
  communityId: string;
  currentUser?: { id: string; fullNames?: string; photo?: string | null } | null;
  isAdmin?: boolean;
  onPostUpdated?: (updated: IMessage) => void;
  onPostDeleted?: (postId: string) => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  communityId,
  currentUser,
  isAdmin = false,
  onPostUpdated,
  onPostDeleted,
}) => {
  const { confirm: confirmAction, dialog: confirmDialog } = useConfirmDialog();

  // Engagement states
  const [likesCount, setLikesCount] = useState<number>(post.likes ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(post.isLikedByMe ?? false);
  const [isLiking, setIsLiking] = useState(false);

  const [isSaved, setIsSaved] = useState<boolean>(post.isSaved ?? false);
  const [isSaving, setIsSaving] = useState(false);

  const [reshareCount, setReshareCount] = useState<number>(post.reshareCount ?? 0);
  const [isResharing, setIsResharing] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ICommentThread[]>(post.comments || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(
    post.commentCount ?? post.comments?.length ?? 0
  );

  // Edit post state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);

  // Image lightbox state
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const isOwnPost = currentUser?.id && post.senderId === currentUser.id;
  const canManagePost = isOwnPost || isAdmin;

  // Sync props if post changes
  useEffect(() => {
    setLikesCount(post.likes ?? 0);
    setIsLiked(post.isLikedByMe ?? false);
    setIsSaved(post.isSaved ?? false);
    setReshareCount(post.reshareCount ?? 0);
    if (post.comments && post.comments.length > 0) {
      setComments(post.comments);
    }
    setCommentsCount(post.commentCount ?? post.comments?.length ?? 0);
  }, [post]);

  // Load comments on first expand
  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);

    if (nextShow && comments.length === 0) {
      setLoadingComments(true);
      try {
        const rawComments = await getPostComments(post.id);
        const normalized = rawComments.map((c) => normalizeComment(c, post.id));
        setComments(normalized);
        setCommentsCount(normalized.length);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Like / Unlike handler
  const handleLike = async () => {
    if (isLiking) return;
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!previousLiked);
    setLikesCount((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1));
    setIsLiking(true);

    try {
      const res = await togglePostLike(communityId, post.id);
      setIsLiked(res.liked);
      setLikesCount(res.likeCount);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          likes: res.likeCount,
          isLikedByMe: res.liked,
        });
      }
    } catch (err: any) {
      // Revert optimistic update
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      toast.error(err?.response?.data?.message || "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  // Save / Bookmark handler
  const handleToggleSave = async () => {
    if (isSaving) return;
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);
    setIsSaving(true);

    try {
      const res = await toggleSavePost(communityId, post.id);
      setIsSaved(res.saved);
      toast.success(res.saved ? "Post saved to your bookmarks" : "Post removed from bookmarks");
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          isSaved: res.saved,
        });
      }
    } catch (err: any) {
      setIsSaved(previousSaved);
      toast.error(err?.response?.data?.message || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  // Reshare handler
  const handleReshare = () => {
    confirmAction({
      title: "Reshare Post",
      message: "Do you want to reshare this post to the community feed?",
      confirmLabel: "Reshare",
      variant: "default",
      onConfirm: async () => {
        setIsResharing(true);
        try {
          await resharePost(communityId, post.id);
          const nextCount = reshareCount + 1;
          setReshareCount(nextCount);
          toast.success("Post reshared to community!");
          if (onPostUpdated) {
            onPostUpdated({
              ...post,
              reshareCount: nextCount,
            });
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to reshare post");
        } finally {
          setIsResharing(false);
        }
      },
    });
  };

  // Share handler
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/messaging?chatId=${communityId}&type=community#post-${post.id}`;
    const shareTitle = post.title || "Community Post";
    const shareText = post.content
      ? post.content.length > 200
        ? post.content.substring(0, 200) + "..."
        : post.content
      : "Check out this post on the Akili CHW platform";

    // Use Web Share API if available (opens native system share dialog on mobile & supported desktop browsers)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
        return;
      } catch (err: any) {
        // User cancelled or dismissed the share dialog
        if (err?.name === "AbortError") {
          return;
        }
        // Fall through to clipboard copy
      }
    }

    // Fallback to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Post link copied to clipboard!");
      } else {
        toast.success("Post link: " + shareUrl);
      }
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Add Comment handler
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const created = await addPostComment(post.id, { text: newCommentText.trim() });
      const normalized = normalizeComment(created, post.id);
      setComments((prev) => [...prev, normalized]);
      setCommentsCount((prev) => prev + 1);
      setNewCommentText("");
      toast.success("Comment added!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Nested reply added
  const handleReplyAdded = (parentId: string, newReply: ICommentThread) => {
    const attachReply = (list: ICommentThread[]): ICommentThread[] =>
      list.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: attachReply(c.replies) };
        }
        return c;
      });

    setComments((prev) => attachReply(prev));
    setCommentsCount((prev) => prev + 1);
  };

  // Edit comment
  const handleEditComment = async (commentId: string, newText: string) => {
    try {
      await editCommunityComment(commentId, newText);
      const updateText = (list: ICommentThread[]): ICommentThread[] =>
        list.map((c) => {
          if (c.id === commentId) return { ...c, text: newText };
          if (c.replies) return { ...c, replies: updateText(c.replies) };
          return c;
        });
      setComments((prev) => updateText(prev));
      toast.success("Comment updated");
    } catch (err: any) {
      toast.error("Failed to update comment");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommunityComment(commentId);
      const removeComment = (list: ICommentThread[]): ICommentThread[] =>
        list
          .filter((c) => c.id !== commentId)
          .map((c) => (c.replies ? { ...c, replies: removeComment(c.replies) } : c));
      setComments((prev) => removeComment(prev));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error("Failed to delete comment");
    }
  };

  // Edit Post submit
  const handleSavePostEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await editCommunityPost(communityId, post.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setIsEditingPost(false);
      toast.success("Post updated!");
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          title: updated.title,
          content: updated.content,
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to edit post");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Post
  const handleDeletePost = () => {
    setMenuOpen(false);
    confirmAction({
      title: "Delete Community Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmLabel: "Delete Post",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteCommunityPost(communityId, post.id);
          toast.success("Post deleted");
          if (onPostDeleted) onPostDeleted(post.id);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to delete post");
        }
      },
    });
  };

  const authorName = post.sender?.fullNames || "Community Member";
  const authorPhoto = realPhoto(post.sender?.photo);
  const formattedTime = new Date(post.timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedHour = new Date(post.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mb-4"
    >
      {/* ─── Reshare Attribution Banner ──────────────────────────── */}
      {post.resharedFromId && (
        <div className="px-4 sm:px-5 py-2 bg-emerald-50/70 border-b border-emerald-100/70 flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Repeat2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>
            {post.sender?.fullNames || "A community member"} reposted
            {post.resharedFrom?.author?.fullNames && (
              <span className="font-normal text-emerald-700">
                {" "}· originally by{" "}
                <strong className="font-semibold text-emerald-900">
                  {post.resharedFrom.author.fullNames}
                </strong>
              </span>
            )}
          </span>
        </div>
      )}

      {/* ─── Post Header ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <ProfileAvatar
            name={authorName}
            photo={authorPhoto}
            size="w-11 h-11"
            className="ring-2 ring-primary/10 shadow-xs flex-shrink-0"
            color="bg-primary/90 text-white"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 truncate">{authorName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Community Post
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {formattedTime} at {formattedHour}
            </p>
          </div>
        </div>

        {/* Header Right Actions (Context Menu) */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">

          {canManagePost && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Post options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsEditingPost(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Post Body ──────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 pt-3">
        {isEditingPost ? (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Post title"
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your post content..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditingPost(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePostEdit}
                disabled={savingEdit || !editContent.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.title && (
              <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug tracking-tight">
                {post.title}
              </h2>
            )}

            {post.content && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words mb-3 font-normal">
                {post.content}
              </p>
            )}

            {/* Media Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl overflow-hidden">
                {post.attachments.map((att, idx) => (
                  <MessageMedia
                    key={idx}
                    attachment={att}
                    variant="bubble"
                    messageId={post.id}
                    isOwn={false}
                    senderName={authorName}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Engagement & Reactions Action Bar ───────────────────── */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
              isLiked
                ? "text-rose-600 bg-rose-50 hover:bg-rose-100/80 font-bold"
                : "text-slate-600 hover:text-rose-600 hover:bg-slate-100"
            }`}
            title={isLiked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
              }`}
            />
            <span>{likesCount > 0 ? likesCount : "Like"}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleToggleComments}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              showComments
                ? "text-primary bg-primary/10 font-bold"
                : "text-slate-600 hover:text-primary hover:bg-slate-100"
            }`}
            title="View or add comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {commentsCount > 0 ? `${commentsCount} ${commentsCount === 1 ? "Comment" : "Comments"}` : "Comment"}
            </span>
          </button>

          {/* Reshare Button */}
          <button
            onClick={handleReshare}
            disabled={isResharing}
            className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            title="Reshare post in community"
          >
            <Repeat2 className={`w-4 h-4 ${isResharing ? "animate-spin text-emerald-600" : ""}`} />
            <span>{reshareCount > 0 ? reshareCount : "Reshare"}</span>
          </button>

          {/* Views / Impressions ("icon with vertical lines") */}
          <div
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-xs font-semibold select-none cursor-default"
            title={`${post.viewCount ?? 0} Views`}
          >
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <span>{(post.viewCount !== undefined && post.viewCount > 0) ? post.viewCount : "0"}</span>
          </div>
        </div>

        {/* Right side actions: Bookmark + Share */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Bookmark / Save Button */}
          <button
            onClick={handleToggleSave}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
              isSaved
                ? "text-amber-600 bg-amber-50 hover:bg-amber-100/80 font-bold"
                : "text-slate-600 hover:text-amber-600 hover:bg-slate-100"
            }`}
            title={isSaved ? "Remove from bookmarks" : "Save post"}
          >
            <Bookmark
              className={`w-4 h-4 transition-transform ${
                isSaved ? "fill-amber-500 text-amber-500" : ""
              }`}
            />
            <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-primary hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            title={typeof navigator !== "undefined" && typeof navigator.share === "function" ? "Share post" : "Copy post link"}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* ─── Expandable Comments Section ──────────────────────────── */}
      {showComments && (
        <div className="bg-slate-50/50 border-t border-slate-200 p-4 sm:p-5 space-y-4">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
            <ProfileAvatar
              name={currentUser?.fullNames || "Me"}
              photo={realPhoto(currentUser?.photo)}
              size="w-9 h-9"
              className="flex-shrink-0 ring-1 ring-slate-200"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white border border-slate-200 text-xs rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={submittingComment || !newCommentText.trim()}
                className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-colors"
                title="Send comment"
              >
                {submittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs">
              No comments yet. Be the first to start the conversation!
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {comments.map((comment) => (
                <CommunityComment
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  currentUserId={currentUser?.id}
                  depth={0}
                  onReplyAdded={handleReplyAdded}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {confirmDialog}
    </article>
  );
};
