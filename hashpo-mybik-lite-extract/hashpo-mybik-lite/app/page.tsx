import { createServerSupabase } from "@/lib/supabase-server";
import HomePage from "./HomePage";

export const revalidate = 60;

export default async function Home() {
  const supabase = createServerSupabase();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <HomePage
      initialSettings={settings ?? undefined}
    />
  );
}
