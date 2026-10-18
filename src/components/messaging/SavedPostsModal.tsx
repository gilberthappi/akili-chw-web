import React, { useState, useEffect } from "react";
import { X, Bookmark, Globe, ArrowRight, Loader2, Heart, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { getSavedPosts, toggleSavePost, ICommunityPostRaw } from "@/services/community.service";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { realPhoto } from "./avatarStyles";

interface SavedPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost?: (communityId: string, postId: string) => void;
}

export const SavedPostsModal: React.FC<SavedPostsModalProps> = ({
  isOpen,
  onClose,
  onSelectPost,
}) => {
  const [posts, setPosts] = useState<ICommunityPostRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    getSavedPosts()
      .then((data) => {
        if (isMounted) {
          setPosts(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error("Failed to load saved posts:", err);
        toast.error("Failed to load saved posts");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleUnsave = async (communityId: string, postId: string) => {
    setUnsavingId(postId);
    try {
      await toggleSavePost(communityId, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post removed from saved");
    } catch (err: any) {
      toast.error("Failed to remove saved post");
    } finally {
      setUnsavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-2xs">
              <Bookmark className="h-5 w-5 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Saved Posts</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  {posts.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Your bookmarked community announcements and discussions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar bg-slate-50/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-56 text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Loading your saved posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-400 mb-3">
                <Bookmark className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No saved posts yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Click the bookmark icon on any community post to save it for easy access later.
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const author = post.author || post.sender;
              const authorName = author?.fullNames || "Community Member";
              const authorPhoto = realPhoto(author?.photo);
              const formattedDate = new Date(post.timestamp).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={post.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <ProfileAvatar
                        name={authorName}
                        photo={authorPhoto}
                        size="w-8 h-8"
                        className="border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{authorName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{formattedDate}</p>
                      </div>
                    </div>

                    {/* Unsave button */}
                    <button
                      onClick={() => handleUnsave(post.communityId, post.id)}
                      disabled={unsavingId === post.id}
                      className="p-1.5 text-amber-500 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Remove from saved"
                    >
                      {unsavingId === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                      ) : (
                        <Bookmark className="h-4 w-4 fill-amber-500" />
                      )}
                    </button>
                  </div>

                  {post.title && (
                    <h5 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {post.title}
                    </h5>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-rose-500" />
                        {post.likeCount ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        {post.commentCount ?? 0}
                      </span>
                    </div>

                    {onSelectPost && (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectPost(post.communityId, post.id);
                        }}
                        className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>View post</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
