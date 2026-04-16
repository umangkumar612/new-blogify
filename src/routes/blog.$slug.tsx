import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { fetchPostBySlug, fetchComments, fetchLikeStatus, toggleLike, toggleBookmark, checkBookmark, addComment, deleteComment } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Bookmark, MessageCircle, Calendar, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — IndigoInk` },
      { name: "description", content: "Read this post on IndigoInk." },
    ],
  }),
  component: BlogDetailPage,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <h1 className="font-heading text-3xl">Post not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back to home</Link>
    </div>
  ),
});

function BlogDetailPage() {
  const { slug } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await fetchPostBySlug(slug);
        setPost(p);
        const [cmts, likeInfo, bk] = await Promise.all([
          fetchComments(p.id),
          fetchLikeStatus(p.id, user?.id),
          checkBookmark(p.id, user?.id),
        ]);
        setComments(cmts);
        setLiked(likeInfo.liked);
        setLikeCount(likeInfo.count);
        setBookmarked(bk);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, user?.id]);

  const handleLike = async () => {
    if (!isAuthenticated || !user) { toast.error("Log in to like posts"); return; }
    await toggleLike(post.id, user.id, liked);
    setLiked(!liked);
    setLikeCount((c) => liked ? c - 1 : c + 1);
  };

  const handleBookmark = async () => {
    if (!isAuthenticated || !user) { toast.error("Log in to bookmark posts"); return; }
    await toggleBookmark(post.id, user.id, bookmarked);
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) { toast.error("Log in to comment"); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(post.id, user.id, commentText.trim());
      setCommentText("");
      const cmts = await fetchComments(post.id);
      setComments(cmts);
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((c) => c.filter((x) => x.id !== id));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!post) return <div className="py-20 text-center"><h1 className="font-heading text-3xl">Post not found</h1></div>;

  const author = (post as any).profiles;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to posts
      </Link>

      {post.cover_image_url && (
        <div className="mb-8 overflow-hidden rounded-xl">
          <img src={post.cover_image_url} alt={post.title} className="w-full object-cover" />
        </div>
      )}

      <article>
        <header className="mb-8">
          <h1 className="font-heading text-3xl leading-tight md:text-5xl">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{author?.display_name || author?.username || "Anonymous"}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(post.created_at), "MMMM d, yyyy")}</span>
          </div>
        </header>

        <div className="prose-invert prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90">
          {post.content}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
          <Button variant={liked ? "default" : "outline"} size="sm" onClick={handleLike}>
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likeCount}
          </Button>
          <Button variant={bookmarked ? "default" : "outline"} size="sm" onClick={handleBookmark}>
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} /> {bookmarked ? "Saved" : "Save"}
          </Button>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" /> {comments.length}
          </span>
        </div>
      </article>

      {/* Comments */}
      <section className="mt-10">
        <h2 className="font-heading text-xl">Comments</h2>

        {isAuthenticated && (
          <form onSubmit={handleComment} className="mt-4 space-y-3">
            <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={3} />
            <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post comment
            </Button>
          </form>
        )}

        <div className="mt-6 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className="rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{c.profiles?.display_name || c.profiles?.username || "Anonymous"}</span>
                    <span className="text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</span>
                  </div>
                  {user?.id === c.user_id && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
