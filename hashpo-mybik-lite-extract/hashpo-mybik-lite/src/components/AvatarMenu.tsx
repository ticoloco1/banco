import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Video, BarChart3, TrendingUp, Settings, LogOut, User, Image, Activity, Globe } from "lucide-react";

const AvatarMenu = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return (
      <Link href="/auth" className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium transition-colors">
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  const initial = user.email?.[0]?.toUpperCase() || "U";

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-primary-foreground text-primary font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity">
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>

          <Link href="/studio" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
            <Upload className="w-3.5 h-3.5" /> Upload Video
          </Link>
          <Link href="/channel" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
            <Video className="w-3.5 h-3.5" /> Channel Content
          </Link>
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
            <BarChart3 className="w-3.5 h-3.5" /> Earnings
          </Link>
          <Link href="/advertiser" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
            <Image className="w-3.5 h-3.5" /> Ad Manager
          </Link>
          <Link href="/exchange" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
            <Activity className="w-3.5 h-3.5" /> Exchange
          </Link>
          <Link href="/site/edit" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
            <Globe className="w-3.5 h-3.5" /> My Mini-Site
          </Link>
          {isAdmin && (
            <Link href="/governance" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors">
              <Settings className="w-3.5 h-3.5" /> Admin Panel
            </Link>
          )}

          <div className="border-t border-border mt-1">
            <button onClick={() => { signOut(); setOpen(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-secondary transition-colors w-full text-left">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarMenu;
