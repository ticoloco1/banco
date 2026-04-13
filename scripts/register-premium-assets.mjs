#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

function normSlug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function buildNamePool() {
  const first = uniq([
    // EN / US
    'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles','Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua',
    'Mary','Patricia','Jennifer','Linda','Elizabeth','Barbara','Susan','Jessica','Sarah','Karen','Nancy','Lisa','Margaret','Betty','Sandra','Ashley','Kimberly','Emily','Donna','Michelle',
    // PT / BR / PT
    'Joao','Jose','Antonio','Francisco','Carlos','Paulo','Pedro','Lucas','Luiz','Marcos','Gabriel','Rafael','Daniela','Mariana','Fernanda','Camila','Juliana','Aline','Beatriz','Larissa',
    // DE / IT / SE / NO / FI / FR / ES / NL / CH / DK / IE
    'Lukas','Leon','Finn','Noah','Elias','Felix','Emma','Mia','Sofia','Hanna','Marco','Luca','Giulia','Francesca','Matteo','Alessandro','Andreas','Erik','Nils','Sven',
    'Oskar','Emil','Aino','Helmi','Matti','Juha','Pierre','Louis','Nicolas','Sophie','Isabella','Mateo','Diego','Lucia','Martina','Ruben','Daan','Lars','Nora','Eva',
    // RU
    'Ivan','Dmitri','Sergei','Alexei','Nikolai','Mikhail','Vladimir','Olga','Anastasia','Ekaterina','Svetlana','Irina',
    // CN
    'Wei','Hao','Jie','Jun','Ming','Lei','Yong','Fang','Mei','Li','Xiu','Yuan','Chen','Lin',
    // AR
    'Mohamed','Ahmed','Ali','Omar','Hassan','Yousef','Karim','Fatima','Aisha','Mariam','Layla','Nour','Amir','Rania',
  ]);

  const last = uniq([
    // EN
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Wilson','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Perez','Thompson',
    // PT/BR
    'Silva','Santos','Oliveira','Souza','Rodrigues','Ferreira','Alves','Pereira','Lima','Gomes','Ribeiro','Carvalho','Almeida','Costa','Araujo',
    // EU
    'Muller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Hoffmann','Rossi','Russo','Ferrari','Esposito','Bianchi',
    'Johansson','Andersson','Karlsson','Nilsson','Eriksson','Hansen','Larsen','Nielsen','Korhonen','Virtanen',
    'Dubois','Lefevre','Moreau','Laurent','Simon','Bernard','Martin','Gonzalez','Fernandez','Lopez','Martinez','Sanchez',
    'Jansen','DeVries','VanDijk','Peeters','Meyer','Nielsen',
    // RU
    'Ivanov','Smirnov','Kuznetsov','Popov','Sokolov','Lebedev','Kozlov','Novikov','Morozov','Petrov',
    // CN
    'Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou',
    // AR
    'AlFarsi','AlHarbi','AlSaud','Haddad','Nasser','Khalil','Rahman','Sayed','Farouk','Hakim',
  ]);

  const full = [];
  for (const f of first) for (const l of last) full.push(normSlug(`${f}-${l}`));
  return uniq(full).filter((x) => x.length >= 2 && x.length <= 32);
}

function buildProfessionPool() {
  const base = uniq([
    'surgeon','anesthesiologist','psychiatrist','orthodontist','dentist','physician','cardiologist','radiologist','neurologist','oncologist',
    'pilot','airline-pilot','captain','co-pilot','aviation-engineer','nurse-practitioner',
    'software-engineer','staff-engineer','principal-engineer','data-scientist','ai-engineer','ml-engineer','cloud-architect','security-architect',
    'solution-architect','devops-engineer','sre-engineer','product-manager','growth-manager','quant-analyst','data-engineer',
    'investment-banker','hedge-fund-manager','portfolio-manager','private-equity-partner','venture-capital-partner','actuary','tax-advisor',
    'corporate-lawyer','ip-lawyer','trial-lawyer','compliance-officer','general-counsel',
    'real-estate-broker','luxury-realtor','commercial-broker','asset-manager','fund-manager',
    'energy-trader','petroleum-engineer','mining-engineer','robotics-engineer','biotech-scientist',
    'dentista','medico','engenheiro-software','advogado-corporativo','cientista-dados','cirurgiao','arquiteto-nuvem','piloto-comercial',
    'arzth','ingenieur','rechtsanwalt','chirurg','pilota','ingegnere','avvocato','lagare','programvareingenjor',
    'jurist','kirurg','lahikari','insinoori','doktor','advokat','dataforskare','bankire',
    'vrach','khirurg','inzhener','advokat-rus','analitik','developer-rus',
    'yisheng','waike-yisheng','ruanjian-gongchengshi','shuju-kexuejia','feixingyuan',
    'tabib','jarrah','mohandis-barmijiat','muhami','mustathmir',
  ]);
  const sectors = ['finance','healthcare','technology','energy','legal','aviation','real-estate','biotech','industry','media'];
  const levels = ['senior','lead','principal','chief','global','regional','executive','independent','private','elite'];

  const out = [];
  for (const b of base) out.push(normSlug(b));
  for (const b of base) for (const lv of levels) out.push(normSlug(`${lv}-${b}`));
  for (const b of base) for (const sc of sectors) out.push(normSlug(`${b}-${sc}`));
  return uniq(out).filter((x) => x.length >= 2 && x.length <= 40);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply;
  const adminUserIdArg = args.find((a) => a.startsWith('--admin-user-id='))?.split('=')[1] || '';
  const priceArg = args.find((a) => a.startsWith('--price='))?.split('=')[1] || '';
  const price = Number(priceArg || '999');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminUserIdEnv = process.env.PLATFORM_ADMIN_USER_ID || '';
  const adminUserId = (adminUserIdArg || adminUserIdEnv || '').trim();

  if (!url || !serviceRole) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!/^[0-9a-f-]{36}$/i.test(adminUserId)) {
    throw new Error('Set PLATFORM_ADMIN_USER_ID (or --admin-user-id=UUID).');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid --price value.');
  }

  const db = createClient(url, serviceRole, { auth: { persistSession: false } });
  const names = buildNamePool().slice(0, 2000);
  const professions = buildProfessionPool().slice(0, 500);
  const candidates = uniq([...names, ...professions]);

  console.log(`[premium-assets] generated names=${names.length}, professions=${professions.length}, total=${candidates.length}`);

  const available = [];
  const blocked = [];
  const batchSize = 200;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const [{ data: sites }, { data: regs }, { data: premiums }] = await Promise.all([
      db.from('mini_sites').select('slug').in('slug', batch),
      db.from('slug_registrations').select('slug,status').in('slug', batch).eq('status', 'active'),
      db.from('premium_slugs').select('slug,sold_to').in('slug', batch),
    ]);

    const used = new Set();
    (sites || []).forEach((r) => used.add(String(r.slug)));
    (regs || []).forEach((r) => used.add(String(r.slug)));
    (premiums || []).forEach((r) => used.add(String(r.slug)));

    for (const slug of batch) {
      if (used.has(slug)) blocked.push(slug);
      else available.push(slug);
    }
  }

  console.log(`[premium-assets] available=${available.length} blocked=${blocked.length} mode=${dryRun ? 'DRY-RUN' : 'APPLY'}`);

  if (dryRun) return;

  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const regRows = available.map((slug) => ({
    user_id: adminUserId,
    slug,
    status: 'active',
    for_sale: false,
    expires_at: expires,
  }));
  const premiumRows = available.map((slug) => ({
    slug,
    keyword: slug,
    price,
    active: true,
    sold_to: null,
  }));

  for (let i = 0; i < regRows.length; i += batchSize) {
    const b = regRows.slice(i, i + batchSize);
    const { error } = await db.from('slug_registrations').upsert(b, { onConflict: 'slug', ignoreDuplicates: false });
    if (error) throw new Error(`slug_registrations upsert failed: ${error.message}`);
  }
  for (let i = 0; i < premiumRows.length; i += batchSize) {
    const b = premiumRows.slice(i, i + batchSize);
    const { error } = await db.from('premium_slugs').upsert(b, { onConflict: 'slug', ignoreDuplicates: false });
    if (error) throw new Error(`premium_slugs upsert failed: ${error.message}`);
  }

  console.log(`[premium-assets] done inserted_or_updated=${available.length}`);
}

main().catch((e) => {
  console.error('[premium-assets] error:', e?.message || e);
  process.exit(1);
});
