import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { updatePost, uploadImage } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/editor/$postId")({
  head: () => ({
    meta: [{ title: "Edit Post — IndigoInk" }],
  }),
  component: EditPostPage,
});

function EditPostPage() {
  const { postId } = Route.useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setExcerpt(data.excerpt || "");
        setPublished(data.published);
        setCoverUrl(data.cover_image_url || "");
      }
      setLoading(false);
    })();
  }, [postId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, user.id);
      setCoverUrl(url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePost(postId, { title, content, excerpt: excerpt || content.slice(0, 200), cover_image_url: coverUrl || undefined, published });
      toast.success("Post updated!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 font-heading text-3xl">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="font-heading text-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cover Image</Label>
          {coverUrl && <img src={coverUrl} alt="Cover" className="mb-2 h-40 w-full rounded-lg object-cover" />}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Change cover image"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="font-body leading-relaxed" />
        </div>
        <div className="flex items-center gap-3">
          <Switch id="published" checked={published} onCheckedChange={setPublished} />
          <Label htmlFor="published">{published ? "Published" : "Draft"}</Label>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
        </div>
      </form>
    </main>
  );
}
