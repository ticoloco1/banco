import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 0);
  const size = Math.min(Number(url.searchParams.get('size') || 30), 100);
  const q = url.searchParams.get('q') || '';
  const forSale = url.searchParams.get('for_sale') === '1';
  const premium = url.searchParams.get('premium') === '1';

  try {
    const supabase = createServerSupabase();
    let query = supabase
      .from('slug_market')
      .select('id,slug,keyword,sale_price,is_premium,highlight_until,owner_id')
      .order('highlight_until', { ascending: false, nullsFirst: false })
      .order('sale_price', { ascending: true, nullsFirst: false })
      .range(page * size, (page + 1) * size - 1);

    if (q) query = query.ilike('slug', `%${q}%`);
    if (forSale) query = query.not('sale_price', 'is', null);
    if (premium) query = query.eq('is_premium', true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ rows: data || [] });
  } catch {
    return NextResponse.json({ rows: [] });
  }
}
