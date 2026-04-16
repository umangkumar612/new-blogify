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
    .select("id, title, slug, excerpt, cover_image_url, created_at, published, author_id, post_likes(count), comments(count)", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  const { data, count, error } = await query;
  if (error) throw error;

  // Fetch author profiles
  const authorIds = [...new Set((data ?? []).map((p) => p.author_id))];
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from("profiles").select("user_id, username, display_name").in("user_id", authorIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const posts = (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    cover_image_url: p.cover_image_url,
    created_at: p.created_at,
    author: profileMap.get(p.author_id) || { username: "Anonymous", display_name: null },
    like_count: p.post_likes?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }));

  return { posts, total: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / limit) };
}

export async function fetchPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;

  // Fetch author profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("user_id", data.author_id)
    .single();

  return { ...data, profiles: profile };
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Fetch commenter profiles
  const userIds = [...new Set((data ?? []).map((c) => c.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return (data ?? []).map((c) => ({
    ...c,
    profiles: profileMap.get(c.user_id) || { username: "Anonymous", display_name: null, avatar_url: null },
  }));
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
    .select("id, created_at, post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch the bookmarked posts
  const postIds = (data ?? []).map((b) => b.post_id);
  if (postIds.length === 0) return [];

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image_url, created_at, author_id")
    .in("id", postIds);

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from("profiles").select("user_id, username, display_name").in("user_id", authorIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const postMap = new Map((posts ?? []).map((p) => [p.id, { ...p, author: profileMap.get(p.author_id) }]));

  return (data ?? []).map((b) => ({
    ...b,
    posts: postMap.get(b.post_id) || null,
  }));
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

export function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 8);
}
