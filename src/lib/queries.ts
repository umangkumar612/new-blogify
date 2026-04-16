import { supabase } from "@/integrations/supabase/client";

export async function fetchPosts({
  page = 1,
  limit = 9,
  search = "",
}: { page?: number; limit?: number; search?: string } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("posts")
    .select(`
      id, title, slug, excerpt, cover_image_url, created_at, published, author_id,
      profiles!posts_author_id_fkey(username, display_name),
      post_likes(count),
      comments(count)
    `, { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const posts = (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    cover_image_url: p.cover_image_url,
    created_at: p.created_at,
    author: p.profiles,
    like_count: p.post_likes?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }));

  return { posts, total: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / limit) };
}

export async function fetchPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey(username, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles!comments_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchLikeStatus(postId: string, userId: string | undefined) {
  if (!userId) return { liked: false, count: 0 };
  
  const [likeCheck, countResult] = await Promise.all([
    supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
    supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
  ]);

  return { liked: !!likeCheck.data, count: countResult.count ?? 0 };
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  }
}

export async function toggleBookmark(postId: string, userId: string, bookmarked: boolean) {
  if (bookmarked) {
    await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("bookmarks").insert({ post_id: postId, user_id: userId });
  }
}

export async function checkBookmark(postId: string, userId: string | undefined) {
  if (!userId) return false;
  const { data } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  return !!data;
}

export async function addComment(postId: string, userId: string, content: string) {
  const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, content });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function fetchUserPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, published, created_at, updated_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchUserBookmarks(userId: string) {
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`
      id, created_at,
      posts(id, title, slug, excerpt, cover_image_url, created_at, profiles!posts_author_id_fkey(username, display_name))
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPost(authorId: string, data: { title: string; content: string; excerpt: string; slug: string; cover_image_url?: string; published: boolean }) {
  const { data: post, error } = await supabase
    .from("posts")
    .insert({ author_id: authorId, ...data })
    .select()
    .single();

  if (error) throw error;
  return post;
}

export async function updatePost(postId: string, data: { title?: string; content?: string; excerpt?: string; slug?: string; cover_image_url?: string; published?: boolean }) {
  const { error } = await supabase.from("posts").update(data).eq("id", postId);
  if (error) throw error;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function uploadImage(file: File, userId: string) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export function generateSlug(title: string) {
  return slugify(title) + "-" + Math.random().toString(36).substring(2, 8);
}
