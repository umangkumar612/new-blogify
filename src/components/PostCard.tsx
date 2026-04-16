import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image_url: string | null;
    created_at: string;
    author?: { username: string; display_name: string | null };
    like_count?: number;
    comment_count?: number;
  };
  featured?: boolean;
}

export function PostCard({ post, featured }: PostCardProps) {
  const authorName = post.author?.display_name || post.author?.username || "Anonymous";

  if (featured) {
    return (
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block">
        <article className="relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          {post.cover_image_url && (
            <div className="aspect-[2/1] w-full overflow-hidden">
              <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </div>
          )}
          <div className="p-6 md:p-8">
            <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{authorName}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.created_at), "MMM d, yyyy")}</span>
            </div>
            <h2 className="font-heading text-2xl leading-tight md:text-3xl">{post.title}</h2>
            {post.excerpt && <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">{post.excerpt}</p>}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.like_count ?? 0}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comment_count ?? 0}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block">
      <article className="overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
        {post.cover_image_url && (
          <div className="aspect-[16/9] overflow-hidden">
            <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          </div>
        )}
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{authorName}</span>
            <span>·</span>
            <span>{format(new Date(post.created_at), "MMM d, yyyy")}</span>
          </div>
          <h3 className="font-heading text-lg leading-snug">{post.title}</h3>
          {post.excerpt && <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">{post.excerpt}</p>}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.like_count ?? 0}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comment_count ?? 0}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
