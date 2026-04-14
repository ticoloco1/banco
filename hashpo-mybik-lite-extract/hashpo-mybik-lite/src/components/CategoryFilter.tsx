import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryFilterProps {
  active: string | null;
  onSelect: (id: string | null) => void;
}

const CategoryFilter = ({ active, onSelect }: CategoryFilterProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: categories } = useQuery({
    queryKey: ["categories-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const tabs = [
    { id: null, name: "Home" },
    { id: "__all__", name: "All" },
    ...(categories || []).map((c) => ({ id: c.id, name: c.name })),
  ];

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [categories]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const handleClick = (id: string | null) => {
    if (id === null || id === "__all__") {
      onSelect(null);
    } else {
      onSelect(active === id ? null : id);
    }
  };

  return (
    <div className="relative flex items-center px-6 py-2 bg-background border-b border-border">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 z-10 w-8 h-8 flex items-center justify-center bg-background border border-border rounded-full shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {tabs.map((tab) => {
          const isActive =
            tab.id === null || tab.id === "__all__"
              ? active === null
              : active === tab.id;

          return (
            <button
              key={tab.id ?? "home"}
              onClick={() => handleClick(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 z-10 w-8 h-8 flex items-center justify-center bg-background border border-border rounded-full shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      )}
    </div>
  );
};

export default CategoryFilter;
