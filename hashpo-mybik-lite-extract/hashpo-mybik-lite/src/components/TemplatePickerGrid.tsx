import { useState } from "react";
import { MINI_SITE_TEMPLATES, TEMPLATE_CATEGORIES, type MiniSiteTemplate } from "@/data/miniSiteTemplates";
import { Check, LayoutGrid, Columns2, Columns3 } from "lucide-react";

interface Props {
  selectedId: string;
  onSelect: (template: MiniSiteTemplate) => void;
}

const colIcon = (n: number) =>
  n === 3 ? <Columns3 className="w-3 h-3" /> : n === 2 ? <Columns2 className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3" />;

const styleLabel: Record<string, string> = {
  minimal: "Minimal",
  bold: "Bold",
  magazine: "Magazine",
  card: "Card",
  glass: "Glass",
};

const TemplatePickerGrid = ({ selectedId, onSelect }: Props) => {
  const [category, setCategory] = useState<string>("All");

  const filtered =
    category === "All"
      ? MINI_SITE_TEMPLATES
      : MINI_SITE_TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              category === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[520px] overflow-y-auto pr-1">
        {filtered.map((tpl) => {
          const isSelected = selectedId === tpl.id;

          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className={`group relative rounded-xl border-2 overflow-hidden transition-all text-left ${
                isSelected
                  ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                  : "border-border hover:border-primary/40 hover:scale-[1.01]"
              }`}
            >
              {/* Mini preview */}
              <div
                className="aspect-[3/4] p-2 flex flex-col gap-1"
                style={{ background: tpl.previewBg }}
              >
                {/* Avatar placeholder */}
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ background: tpl.previewAccent }}
                  />
                  <div className="flex-1 space-y-0.5">
                    <div
                      className="h-1.5 rounded-full w-3/4"
                      style={{ background: tpl.previewAccent + "80" }}
                    />
                    <div
                      className="h-1 rounded-full w-1/2 opacity-40"
                      style={{ background: tpl.previewAccent + "60" }}
                    />
                  </div>
                </div>

                {/* Section blocks */}
                {tpl.sections.slice(0, 3).map((sec, i) => {
                  if (sec === "videos") {
                    const cols = tpl.layoutColumns;
                    return (
                      <div key={i} className={`grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        {Array.from({ length: cols * 2 }).map((_, j) => (
                          <div
                            key={j}
                            className="aspect-video rounded-sm"
                            style={{ background: tpl.previewAccent + "30" }}
                          />
                        ))}
                      </div>
                    );
                  }
                  if (sec === "links") {
                    return (
                      <div key={i} className="space-y-0.5">
                        {[1, 2].map((j) => (
                          <div
                            key={j}
                            className="h-2 rounded-full"
                            style={{ background: tpl.previewAccent + "25" }}
                          />
                        ))}
                      </div>
                    );
                  }
                  if (sec === "cv") {
                    return (
                      <div
                        key={i}
                        className="h-4 rounded-sm border"
                        style={{
                          borderColor: tpl.previewAccent + "40",
                          background: tpl.previewAccent + "10",
                        }}
                      />
                    );
                  }
                  if (sec === "feed") {
                    return (
                      <div key={i} className="space-y-0.5">
                        <div
                          className="h-3 rounded-sm"
                          style={{ background: tpl.previewAccent + "15" }}
                        />
                      </div>
                    );
                  }
                  // bio
                  return (
                    <div key={i} className="space-y-0.5">
                      <div
                        className="h-1 rounded-full w-full"
                        style={{ background: tpl.previewAccent + "30" }}
                      />
                      <div
                        className="h-1 rounded-full w-2/3"
                        style={{ background: tpl.previewAccent + "20" }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Label */}
              <div className="px-2 py-2 bg-card space-y-0.5">
                <p className="text-[10px] font-black text-foreground truncate leading-tight">
                  {tpl.name}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                  {colIcon(tpl.layoutColumns)}
                  <span>{tpl.layoutColumns}col</span>
                  <span>·</span>
                  <span>{styleLabel[tpl.style]}</span>
                  {tpl.showCv && (
                    <>
                      <span>·</span>
                      <span className="text-primary">CV</span>
                    </>
                  )}
                </div>
              </div>

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {filtered.length} template{filtered.length !== 1 ? "s" : ""} disponíveis
      </p>
    </div>
  );
};

export default TemplatePickerGrid;
