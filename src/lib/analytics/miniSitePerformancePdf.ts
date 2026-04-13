import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { NamedCount } from '@/lib/analytics/trafficAggregates';

export type MiniSitePdfPayload = {
  siteName: string;
  slug: string;
  generatedAt: string;
  totalSessions: number;
  topCities: NamedCount[];
  topRegions: NamedCount[];
  clicks: NamedCount[];
};

export async function buildMiniSitePerformancePdf(p: MiniSitePdfPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  let y = height - 56;
  const left = 48;
  const line = 14;

  const draw = (text: string, size: number, bold = false, gray = 0.15) => {
    page.drawText(text, {
      x: left,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(gray, gray, gray),
      maxWidth: width - left * 2,
    });
    y -= size + 4;
  };

  draw('TrustBank — Relatório de performance (mini-site)', 16, true, 0.1);
  y -= 4;
  draw(`${p.siteName} · ${p.slug}`, 11, false, 0.35);
  draw(`Gerado em: ${p.generatedAt}`, 9, false, 0.45);
  y -= line;

  draw(`Sessões registadas (amostra analisada): ${p.totalSessions}`, 11, true);
  y -= line;

  draw('Top cidades (visitas)', 12, true);
  if (p.topCities.length === 0) draw('— sem dados de cidade —', 10);
  else p.topCities.forEach((c, i) => draw(`${i + 1}. ${c.name} — ${c.value}`, 10));
  y -= line;

  draw('Top estados / regiões', 12, true);
  if (p.topRegions.length === 0) draw('— sem dados de região —', 10);
  else p.topRegions.forEach((c, i) => draw(`${i + 1}. ${c.name} — ${c.value}`, 10));
  y -= line;

  draw('Cliques rastreados (data-tb-analytics)', 12, true);
  if (p.clicks.length === 0) draw('— sem cliques registados —', 10);
  else p.clicks.forEach((c, i) => draw(`${i + 1}. ${c.name} — ${c.value}`, 10));
  y -= line * 2;

  draw(
    'Nota: cidade e região derivam dos headers da edge (ex.: Vercel / Cloudflare). ' +
      'Os números refletem sessões capturadas pelo tracker público do TrustBank.',
    8,
    false,
    0.5,
  );

  return pdf.save();
}
