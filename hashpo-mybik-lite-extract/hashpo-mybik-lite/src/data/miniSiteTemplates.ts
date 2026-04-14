export interface MiniSiteTemplate {
  id: string;
  name: string;
  category: string;
  theme: string;
  layoutColumns: 1 | 2 | 3;
  showCv: boolean;
  sections: string[]; // ordered list of visible sections
  style: "minimal" | "bold" | "magazine" | "card" | "glass";
  /** HSL accent used in the thumbnail preview */
  previewAccent: string;
  previewBg: string;
  description: string;
}

// Helpers to generate many templates systematically
const t = (
  id: string,
  name: string,
  category: string,
  theme: string,
  layoutColumns: 1 | 2 | 3,
  showCv: boolean,
  sections: string[],
  style: MiniSiteTemplate["style"],
  previewAccent: string,
  previewBg: string,
  description: string
): MiniSiteTemplate => ({
  id, name, category, theme, layoutColumns, showCv, sections, style, previewAccent, previewBg, description,
});

export const TEMPLATE_CATEGORIES = [
  "All",
  "Creator",
  "Business",
  "Portfolio",
  "Music",
  "Gaming",
  "Lifestyle",
  "Education",
  "Tech",
  "Fashion",
  "Art",
  "Real Estate",
] as const;

export const MINI_SITE_TEMPLATES: MiniSiteTemplate[] = [
  // ─── Creator (10) ───
  t("creator-spotlight",    "Creator Spotlight",     "Creator",    "cosmic",   2, false, ["bio","videos","links","feed"],           "bold",     "#a855f7", "#1e1b4b", "Bold 2-col layout for video creators"),
  t("creator-minimal",      "Creator Minimal",       "Creator",    "midnight", 1, false, ["bio","videos","links"],                  "minimal",  "#64748b", "#0f172a", "Clean single-column creator page"),
  t("creator-magazine",     "Creator Magazine",      "Creator",    "ocean",    3, false, ["bio","feed","videos","links"],           "magazine", "#06b6d4", "#0c4a6e", "Magazine-style 3-col video grid"),
  t("creator-glass",        "Creator Glass",         "Creator",    "cosmic",   2, false, ["bio","videos","feed","links"],           "glass",    "#c084fc", "#312e81", "Frosted glass cards with cosmic bg"),
  t("creator-portfolio",    "Creator Portfolio",     "Creator",    "sunset",   3, true,  ["bio","cv","videos","links","feed"],      "card",     "#f59e0b", "#78350f", "Full portfolio with CV and video grid"),
  t("creator-dark",         "Creator Dark",          "Creator",    "midnight", 2, false, ["bio","videos","links"],                  "bold",     "#94a3b8", "#020617", "Dark minimal creator hub"),
  t("creator-neon",         "Creator Neon",          "Creator",    "cosmic",   2, false, ["bio","videos","links","feed"],           "glass",    "#e879f9", "#3b0764", "Neon-glow cosmic creator page"),
  t("creator-wide",         "Creator Wide",          "Creator",    "ocean",    3, false, ["bio","videos","links"],                  "bold",     "#22d3ee", "#083344", "Wide 3-col cinema-style layout"),
  t("creator-feed-first",   "Creator Feed First",    "Creator",    "forest",   1, false, ["feed","bio","videos","links"],           "minimal",  "#34d399", "#064e3b", "Feed-centric single column"),
  t("creator-pro",          "Creator Pro",           "Creator",    "sunset",   2, true,  ["bio","cv","videos","feed","links"],      "magazine", "#fbbf24", "#451a03", "Professional creator with resume"),

  // ─── Business (8) ───
  t("business-corporate",   "Business Corporate",    "Business",   "midnight", 1, true,  ["bio","cv","links","videos"],             "minimal",  "#475569", "#0f172a", "Clean corporate one-pager"),
  t("business-startup",     "Business Startup",      "Business",   "ocean",    2, true,  ["bio","cv","videos","links","feed"],      "bold",     "#0ea5e9", "#0c4a6e", "Startup pitch with video demos"),
  t("business-consulting",  "Business Consulting",   "Business",   "midnight", 1, true,  ["bio","cv","links"],                      "card",     "#64748b", "#1e293b", "Consultant profile with CV"),
  t("business-agency",      "Business Agency",       "Business",   "cosmic",   3, false, ["bio","videos","links","feed"],           "glass",    "#8b5cf6", "#1e1b4b", "Agency showcase with glass cards"),
  t("business-executive",   "Business Executive",    "Business",   "midnight", 1, true,  ["bio","cv","links","videos"],             "minimal",  "#334155", "#020617", "Executive-level minimalism"),
  t("business-saas",        "Business SaaS",         "Business",   "ocean",    2, false, ["bio","videos","links","feed"],           "bold",     "#38bdf8", "#0c4a6e", "SaaS product showcase"),
  t("business-freelancer",  "Business Freelancer",   "Business",   "forest",   1, true,  ["bio","cv","videos","links"],             "card",     "#10b981", "#064e3b", "Freelancer profile with portfolio"),
  t("business-brand",       "Business Brand",        "Business",   "sunset",   2, false, ["bio","links","videos","feed"],           "magazine", "#f59e0b", "#78350f", "Brand landing with warm tones"),

  // ─── Portfolio (6) ───
  t("portfolio-gallery",    "Portfolio Gallery",     "Portfolio",  "midnight", 3, true,  ["bio","cv","videos","links"],             "card",     "#6b7280", "#111827", "Gallery-style project showcase"),
  t("portfolio-case-study", "Portfolio Case Study",  "Portfolio",  "ocean",    1, true,  ["bio","cv","videos","links"],             "magazine", "#06b6d4", "#164e63", "Long-form case study layout"),
  t("portfolio-grid",       "Portfolio Grid",        "Portfolio",  "cosmic",   3, true,  ["bio","videos","cv","links"],             "bold",     "#a78bfa", "#312e81", "Dense 3-col portfolio grid"),
  t("portfolio-clean",      "Portfolio Clean",       "Portfolio",  "midnight", 2, true,  ["bio","cv","videos","links"],             "minimal",  "#9ca3af", "#0f172a", "Minimal 2-col portfolio"),
  t("portfolio-visual",     "Portfolio Visual",      "Portfolio",  "sunset",   3, false, ["bio","videos","links"],                  "glass",    "#fb923c", "#431407", "Visual-heavy with warm glass"),
  t("portfolio-resume",     "Portfolio Resume",      "Portfolio",  "forest",   1, true,  ["cv","bio","videos","links"],             "minimal",  "#059669", "#064e3b", "Resume-first portfolio layout"),

  // ─── Music (5) ───
  t("music-artist",         "Music Artist",          "Music",      "cosmic",   2, false, ["bio","videos","links","feed"],           "glass",    "#d946ef", "#4a044e", "Purple-glow artist page"),
  t("music-band",           "Music Band",            "Music",      "midnight", 3, false, ["bio","videos","feed","links"],           "bold",     "#6366f1", "#1e1b4b", "Band page with video grid"),
  t("music-producer",       "Music Producer",        "Music",      "ocean",    2, false, ["bio","videos","links"],                  "card",     "#14b8a6", "#042f2e", "Teal-toned producer showcase"),
  t("music-dj",             "Music DJ",              "Music",      "cosmic",   1, false, ["bio","videos","links","feed"],           "glass",    "#f472b6", "#500724", "Neon-pink DJ profile"),
  t("music-label",          "Music Label",           "Music",      "midnight", 3, false, ["bio","videos","links","feed"],           "magazine", "#818cf8", "#1e1b4b", "Label page with magazine layout"),

  // ─── Gaming (5) ───
  t("gaming-streamer",      "Gaming Streamer",       "Gaming",     "cosmic",   2, false, ["bio","videos","feed","links"],           "bold",     "#a855f7", "#3b0764", "Streamer hub with highlights"),
  t("gaming-esports",       "Gaming Esports",        "Gaming",     "midnight", 3, false, ["bio","videos","links","feed"],           "glass",    "#22d3ee", "#0f172a", "Esports team / player page"),
  t("gaming-retro",         "Gaming Retro",          "Gaming",     "sunset",   2, false, ["bio","videos","links"],                  "card",     "#facc15", "#422006", "Retro gaming aesthetic"),
  t("gaming-clips",         "Gaming Clips",          "Gaming",     "ocean",    3, false, ["videos","bio","links","feed"],           "bold",     "#06b6d4", "#0e7490", "Clips-first gaming page"),
  t("gaming-community",     "Gaming Community",      "Gaming",     "forest",   2, false, ["feed","bio","videos","links"],           "magazine", "#4ade80", "#052e16", "Community-focused gaming hub"),

  // ─── Lifestyle (4) ───
  t("lifestyle-influencer", "Lifestyle Influencer",  "Lifestyle",  "sunset",   2, false, ["bio","videos","links","feed"],           "glass",    "#fb923c", "#431407", "Warm influencer page"),
  t("lifestyle-travel",     "Lifestyle Travel",      "Lifestyle",  "ocean",    3, false, ["bio","videos","links","feed"],           "magazine", "#0ea5e9", "#0c4a6e", "Travel vlog showcase"),
  t("lifestyle-wellness",   "Lifestyle Wellness",    "Lifestyle",  "forest",   1, false, ["bio","videos","links","feed"],           "minimal",  "#34d399", "#022c22", "Wellness & health single-col"),
  t("lifestyle-food",       "Lifestyle Food",        "Lifestyle",  "sunset",   3, false, ["bio","videos","links"],                  "card",     "#f97316", "#7c2d12", "Food creator with warm cards"),

  // ─── Education (4) ───
  t("edu-instructor",       "Edu Instructor",        "Education",  "ocean",    2, true,  ["bio","cv","videos","links","feed"],      "card",     "#0284c7", "#0c4a6e", "Online instructor profile"),
  t("edu-course",           "Edu Course",            "Education",  "forest",   1, true,  ["bio","videos","cv","links"],             "minimal",  "#059669", "#064e3b", "Single course landing page"),
  t("edu-academy",          "Edu Academy",           "Education",  "midnight", 3, true,  ["bio","videos","cv","links","feed"],      "bold",     "#475569", "#0f172a", "Multi-course academy hub"),
  t("edu-tutor",            "Edu Tutor",             "Education",  "cosmic",   1, true,  ["bio","cv","videos","links"],             "glass",    "#7c3aed", "#2e1065", "Personal tutor with glass CV"),

  // ─── Tech (4) ───
  t("tech-developer",       "Tech Developer",        "Tech",       "midnight", 2, true,  ["bio","cv","videos","links"],             "minimal",  "#38bdf8", "#0c4a6e", "Developer portfolio with CV"),
  t("tech-devrel",          "Tech DevRel",           "Tech",       "ocean",    2, false, ["bio","videos","feed","links"],           "bold",     "#06b6d4", "#083344", "DevRel / advocate showcase"),
  t("tech-startup-founder", "Tech Startup Founder",  "Tech",       "cosmic",   1, true,  ["bio","cv","videos","links","feed"],      "glass",    "#8b5cf6", "#1e1b4b", "Founder profile with pitch videos"),
  t("tech-hacker",          "Tech Hacker",           "Tech",       "midnight", 1, false, ["bio","videos","links"],                  "minimal",  "#22c55e", "#052e16", "Terminal-green hacker aesthetic"),

  // ─── Fashion (2) ───
  t("fashion-model",        "Fashion Model",         "Fashion",    "cosmic",   3, false, ["bio","videos","links","feed"],           "glass",    "#ec4899", "#500724", "High-fashion model portfolio"),
  t("fashion-brand",        "Fashion Brand",         "Fashion",    "midnight", 2, false, ["bio","videos","links"],                  "magazine", "#a855f7", "#1e1b4b", "Fashion brand lookbook"),

  // ─── Art (2) ───
  t("art-gallery",          "Art Gallery",           "Art",        "midnight", 3, false, ["bio","videos","links"],                  "card",     "#f43f5e", "#1c1917", "Digital art gallery layout"),
  t("art-studio",           "Art Studio",            "Art",        "sunset",   2, true,  ["bio","cv","videos","links","feed"],      "glass",    "#e11d48", "#4c0519", "Artist studio with warm glass"),

  // ─── Real Estate (6) ───
  t("realestate-broker",    "Broker Premium",        "Real Estate","midnight", 2, true,  ["bio","cv","videos","links","feed"],      "bold",     "#0ea5e9", "#0c4a6e", "Professional broker with property showcase"),
  t("realestate-luxury",    "Luxury Properties",     "Real Estate","cosmic",   3, false, ["bio","videos","links","feed"],           "glass",    "#c084fc", "#312e81", "Luxury real estate with glass cards"),
  t("realestate-agency",    "Agency Landing",        "Real Estate","midnight", 3, true,  ["bio","cv","videos","links","feed"],      "magazine", "#64748b", "#0f172a", "Real estate agency with team showcase"),
  t("realestate-modern",    "Modern Realty",         "Real Estate","ocean",    2, true,  ["bio","cv","videos","links"],             "card",     "#06b6d4", "#164e63", "Clean modern real estate layout"),
  t("realestate-commercial","Commercial Properties", "Real Estate","midnight", 3, false, ["bio","videos","links","feed"],           "bold",     "#475569", "#0f172a", "Commercial property listings"),
  t("realestate-tropical",  "Tropical Homes",        "Real Estate","sunset",   2, false, ["bio","videos","links","feed"],           "glass",    "#f59e0b", "#78350f", "Warm tropical property showcase"),
];

export const getTemplate = (id: string): MiniSiteTemplate | undefined =>
  MINI_SITE_TEMPLATES.find((t) => t.id === id);

export const getTemplatesByCategory = (category: string): MiniSiteTemplate[] =>
  category === "All"
    ? MINI_SITE_TEMPLATES
    : MINI_SITE_TEMPLATES.filter((t) => t.category === category);
