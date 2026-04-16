import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PenSquare, LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { isAuthenticated, profile, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-heading text-2xl tracking-wide text-primary">
          IndigoInk
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                <LayoutDashboard className="mr-1 inline h-4 w-4" /> Dashboard
              </Link>
              <Link to="/editor" className="text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                <PenSquare className="mr-1 inline h-4 w-4" /> Write
              </Link>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!isLoading && (
            isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{profile?.display_name || profile?.username}</span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm">Dashboard</Link>
                <Link to="/editor" onClick={() => setMobileOpen(false)} className="text-sm">Write</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left text-sm text-destructive">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
