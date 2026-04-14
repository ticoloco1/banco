import singerImg from "@/assets/categories/singer.webp";
import filmmakerImg from "@/assets/categories/filmmaker.webp";
import digitalArtistImg from "@/assets/categories/digital-artist.webp";
import influencerImg from "@/assets/categories/influencer.webp";
import podcasterImg from "@/assets/categories/podcaster.webp";
import streamerImg from "@/assets/categories/streamer.webp";
import gamerImg from "@/assets/categories/gamer.webp";
import designerImg from "@/assets/categories/designer.webp";
import journalistImg from "@/assets/categories/journalist.webp";
import musicianImg from "@/assets/categories/musician.webp";

export interface PlatformSettings {
  listingFeeInternal: number;
  listingFeeGateway: number;
  commissionPaywall: number;
  commissionAds: number;
  commissionShares: number;
  valuationMultiplier: number;
  annualPlanPrice: number;
}

export interface Category {
  id: string;
  name: string;
  avatar: string;
}

export interface VideoSlot {
  id: number;
  title: string;
  category: string;
  ticker: string;
  sharePrice: number;
  totalShares: number;
  revenue: number;
  featured: boolean;
  blocked: boolean;
  exchangeActive: boolean;
  creator: string;
  sharesIssued: boolean;
  polygonHash: string | null;
  thumbnail: string;
}

export const categories: Category[] = [
  { id: "filmmaker", name: "Filmmaker", avatar: filmmakerImg },
  { id: "singer", name: "Singer", avatar: singerImg },
  { id: "musician", name: "Musician", avatar: musicianImg },
  { id: "podcaster", name: "Podcaster", avatar: podcasterImg },
  { id: "streamer", name: "Streamer", avatar: streamerImg },
  { id: "gamer", name: "Gamer", avatar: gamerImg },
  { id: "influencer", name: "Influencer", avatar: influencerImg },
  { id: "digital-artist", name: "Digital Artist", avatar: digitalArtistImg },
  { id: "designer", name: "Designer", avatar: designerImg },
  { id: "journalist", name: "Journalist", avatar: journalistImg },
];

const creatorNames = [
  "Alex Storm", "Luna Ray", "Max Volt", "Sara Wave", "Kai Flux",
  "Nova Light", "Zara Code", "Leo Drift", "Maya Spark", "Ryu Edge",
  "Jada Flow", "Finn Surge", "Aria Glow", "Dex Shift", "Mila Core",
];

const titlePrefixes = [
  "The Rise of", "Inside", "Breaking", "Behind", "Next Level",
  "Mastering", "Secrets of", "The Art of", "Evolution of", "Deep Dive:",
];

const titleSuffixes = [
  "Digital Empire", "Creative Flow", "Street Culture", "Tech Vision", "Game Theory",
  "Sound Design", "Visual Arts", "Content Lab", "Media Hub", "Pixel World",
  "Beat Drop", "Frame by Frame", "Live Session", "Code Art", "Viral Wave",
];

function generateTicker(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const l1 = letters[index % 26];
  const l2 = letters[(index * 7 + 3) % 26];
  const l3 = letters[(index * 13 + 11) % 26];
  const num = (index % 90) + 10;
  return `$${l1}${l2}${l3}${num}`;
}

const thumbnailColors = [
  "1a1a2e", "16213e", "0f3460", "533483", "2c3e50",
  "1b4332", "2d3436", "341f97", "222f3e", "130f40",
];

export function generateMockVideos(): VideoSlot[] {
  const catIds = categories.map(c => c.id);
  const videos: VideoSlot[] = [];
  
  for (let i = 0; i < 150; i++) {
    const prefix = titlePrefixes[i % titlePrefixes.length];
    const suffix = titleSuffixes[i % titleSuffixes.length];
    const revenue = parseFloat((Math.random() * 5000 + 100).toFixed(2));
    videos.push({
      id: i + 1,
      title: `${prefix} ${suffix}`,
      category: catIds[i % catIds.length],
      ticker: generateTicker(i),
      sharePrice: parseFloat((Math.random() * 50 + 0.5).toFixed(2)),
      totalShares: Math.floor(Math.random() * 10000) + 100,
      revenue,
      featured: i < 5,
      blocked: false,
      exchangeActive: true,
      creator: creatorNames[i % creatorNames.length],
      sharesIssued: i < 10,
      polygonHash: i < 10 ? `0x${Math.random().toString(16).slice(2, 42)}` : null,
      thumbnail: `https://placehold.co/400x225/${thumbnailColors[i % thumbnailColors.length]}/FFD700?text=${generateTicker(i).replace("$", "")}`,
    });
  }
  return videos;
}

export const defaultSettings: PlatformSettings = {
  listingFeeInternal: 20,
  listingFeeGateway: 80,
  commissionPaywall: 30,
  commissionAds: 35,
  commissionShares: 5,
  valuationMultiplier: 50,
  annualPlanPrice: 80,
};
