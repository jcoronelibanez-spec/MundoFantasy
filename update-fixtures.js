// update-fixtures.js — próxima jornada con fallback (football-data.org v4, PD = LaLiga)
const fs = require('fs');

const API_URL  = 'https://api.football-data.org/v4/competitions/PD/matches';
const TIMEZONE = 'Europe/Madrid';

// Rango: hoy → hoy + N días (ampliado a 60 para garantizar resultados)
function rangeNextDays(days = 60) {
  const now = new Date();
  const to  = new Date(now);
  to.setUTCDate(to.getUTCDate() + days);
  const d = x => x.toISOString().slice(0,10); // YYYY-MM-DD
  return { from: d(now), to: d(to) };
}

// Formatos locales para España
function formatLocal(iso, tz = TIMEZONE) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d).reduce((a,p)=> (a[p.type]=p.value, a), {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

async function run() {
  const token = process.env.FOOTBALLDATA_KEY;
  if (!token) {
    console.error('❌ Falta FOOTBALLDATA_KEY en Settings → Secrets → Actions.');
    process.exit(1);
  }

  const { from, to } = rangeNextDays(60);
  const url = `${API_URL}?status=SCHEDULED&dateFrom=${from}&dateTo=${to}`;
  console.log('ℹ️ Pidiendo:', url);

  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Error API ${res.status}: ${txt}`);
    process.exit(1);
  }

  const data = await res.json();
  const ms = (data.matches || []).filter(Boolean);
  if (!ms.length) {
    fs.writeFileSync('fixtures.json', JSON.stringify({ matchday: null, days: [] }, null, 2));
    console.log('ℹ️ Sin partidos programados en el rango.');
    return;
  }

  // Partidos programados (SCHEDULED)
  const scheduled = ms
    .filter(m => m.status === 'SCHEDULED')
    .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate));

  // Intento 1: detectar PRÓXIMA jornada por matchday
  const withMD = scheduled.filter(m => m.matchday != null);
  let nextMD = null;
  if (withMD.length) {
    nextMD = Math.min(...withMD.map(m => m.matchday));
  }

  // Si hay matchday → filtra esa jornada; si no → coge los próximos 10 partidos
  const picked = nextMD
    ? scheduled.filter(m => m.matchday === nextMD)
    : scheduled.slice(0, 10);

  // Agrupar por fecha local (YYYY-MM-DD)
  const daysMap = new Map();
  for (const m of picked) {
    const { date, time } = formatLocal(m.utcDate);
    const item = {
      hora: time,
      local: m.homeTeam?.name,
      visitante: m.awayTeam?.name,
      localCrest: m.homeTeam?.crest || '',
      visitanteCrest: m.awayTeam?.crest || '',
      comp: m.competition?.name || 'LaLiga'
    };
    if (!daysMap.has(date)) daysMap.set(date, []);
    daysMap.get(date).push(item);
  }

  const out = {
    matchday: nextMD ?? null,
    days: [...daysMap.entries()].map(([date, matches]) => ({ date, matches }))
  };

  fs.writeFileSync('fixtures.json', JSON.stringify(out, null, 2), 'utf-8');
  console.log(`✅ Jornada ${nextMD ?? 'fallback'} con ${picked.length} partidos → fixtures.json`);
}

run().catch(e => { console.error('❌ Error general:', e); process.exit(1); });
