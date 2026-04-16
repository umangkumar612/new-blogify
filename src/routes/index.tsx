import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { fetchPosts } from "@/lib/queries";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IndigoInk — Discover Stories & Ideas" },
      { name: "description", content: "A modern blogging platform. Discover stories, ideas, and expertise from writers on any topic." },
      { property: "og:title", content: "IndigoInk — Discover Stories & Ideas" },
      { property: "og:description", content: "A modern blogging platform. Discover stories, ideas, and expertise from writers on any topic." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPosts({ page, search });
      setPosts(result.posts);
      setTotalPages(result.totalPages);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const featured = posts[0];
  const grid = posts.slice(1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero section */}
      <section className="mb-12 text-center">
        <h1 className="font-heading text-4xl leading-tight md:text-6xl">
          Welcome to <span className="text-primary">IndigoInk</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Discover stories, ideas, and expertise from writers on any topic.
        </p>

        <form onSubmit={handleSearch} className="mx-auto mt-6 flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts..."
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">No posts found.</p>
          {search && <p className="mt-2 text-sm text-muted-foreground">Try a different search term.</p>}
        </div>
      ) : (
        <>
          {/* Featured post */}
          {featured && <section className="mb-10"><PostCard post={featured} featured /></section>}

          {/* Grid */}
          {grid.length > 0 && (
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((post) => <PostCard key={post.id} post={post} />)}
            </section>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
