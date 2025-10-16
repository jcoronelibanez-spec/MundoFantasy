// update-fixtures.js — próxima jornada (football-data.org v4, competición PD = LaLiga)
const fs = require('fs');

const API_URL  = 'https://api.football-data.org/v4/competitions/PD/matches';
const TIMEZONE = 'Europe/Madrid';

// Rango: hoy → hoy + 21 días (de aquí detectamos la próxima jornada)
function rangeNextDays(days = 21) {
  const now = new Date();
  const to  = new Date(now);
  to.setUTCDate(to.getUTCDate() + days);
  const d = x => x.toISOString().slice(0,10); // YYYY-MM-DD
  return { from: d(now), to: d(to) };
}

// YYYY-MM-DD y HH:mm locales España
function formatLocal(iso, tz = TIMEZONE) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
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

  const { from, to } = rangeNextDays(21);
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

  // Detecta la PRÓXIMA jornada (mínimo matchday con estado SCHEDULED)
  const scheduled = ms.filter(m => m.status === 'SCHEDULED' && m.matchday != null);
  const nextMD = Math.min(...scheduled.map(m => m.matchday));

  // Filtra solo esa jornada
  const jornada = scheduled.filter(m => m.matchday === nextMD)
    .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate));

  // Agrupar por fecha local (YYYY-MM-DD)
  const daysMap = new Map();
  for (const m of jornada) {
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

  // Estructura final esperada por el front
  const out = {
    matchday: nextMD,              // número de jornada
    days: [...daysMap.entries()]   // [ [ 'YYYY-MM-DD', [ {..}, .. ] ], ... ]
      .map(([date, matches]) => ({ date, matches }))
  };

  fs.writeFileSync('fixtures.json', JSON.stringify(out, null, 2), 'utf-8');
  console.log(`✅ Jornada ${nextMD} con ${jornada.length} partidos → fixtures.json`);
}

run().catch(e => { console.error('❌ Error general:', e); process.exit(1); });
