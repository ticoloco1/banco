import { categories } from "@/data/mockDatabase";

interface CategoryBannerProps {
  activeCategories: string[];
}

const CategoryBanner = ({ activeCategories }: CategoryBannerProps) => {
  const displayed = activeCategories.length > 0
    ? categories.filter((c) => activeCategories.includes(c.id))
    : categories;

  return (
    <div className="flex items-center gap-4 py-3 px-2 overflow-x-auto scrollbar-hide">
      {displayed.map((cat) => (
        <div key={cat.id} className="flex items-center gap-2 shrink-0">
          <img
            src={cat.avatar}
            alt={cat.name}
            className="w-7 h-7 rounded-full object-cover border-2 border-primary"
          />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {cat.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryBanner;
