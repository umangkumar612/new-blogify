import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { fetchUserPosts, fetchUserBookmarks, deletePost } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare, Trash2, Eye, Edit, Loader2, BookOpen, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — IndigoInk" },
      { name: "description", content: "Manage your posts and bookmarks." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "bookmarks">("posts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [p, b] = await Promise.all([fetchUserPosts(user.id), fetchUserBookmarks(user.id)]);
        setPosts(p);
        setBookmarks(b);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (authLoading || !isAuthenticated) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl">Dashboard</h1>
        <Link to="/editor">
          <Button><PenSquare className="mr-2 h-4 w-4" /> New Post</Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <Button variant={tab === "posts" ? "default" : "outline"} size="sm" onClick={() => setTab("posts")}>
          <BookOpen className="mr-1 h-4 w-4" /> My Posts ({posts.length})
        </Button>
        <Button variant={tab === "bookmarks" ? "default" : "outline"} size="sm" onClick={() => setTab("bookmarks")}>
          <Bookmark className="mr-1 h-4 w-4" /> Bookmarks ({bookmarks.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : tab === "posts" ? (
        posts.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No posts yet. Start writing!</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium">{p.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                      <span>{format(new Date(p.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.published && (
                      <Link to="/blog/$slug" params={{ slug: p.slug }}>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    )}
                    <Link to="/editor/$postId" params={{ postId: p.id }}>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        bookmarks.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No bookmarks yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b: any) => (
              <Card key={b.id}>
                <CardContent className="py-4">
                  <Link to="/blog/$slug" params={{ slug: b.posts?.slug }} className="font-medium hover:text-primary">
                    {b.posts?.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{b.posts?.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </main>
  );
}
