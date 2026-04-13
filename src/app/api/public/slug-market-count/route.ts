import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const forSale = url.searchParams.get('for_sale') === '1';
  const premium = url.searchParams.get('premium') === '1';

  try {
    const supabase = createServerSupabase();
    let query = supabase.from('slug_market').select('id', { count: 'exact', head: true });

    if (q) query = query.ilike('slug', `%${q}%`);
    if (forSale) query = query.not('sale_price', 'is', null);
    if (premium) query = query.eq('is_premium', true);

    const { count } = await query;
    return NextResponse.json({ count: count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
