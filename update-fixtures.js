// update-fixtures.js — próximos 20 partidos (formato plano)
const fs = require('fs');

const API_URL = 'https://api.football-data.org/v4/competitions/PD/matches';
const TIMEZONE = 'Europe/Madrid';

// "YYYY-MM-DD HH:mm" en horario España
function formatLocal(iso, tz = TIMEZONE) {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('es-ES', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

async function run() {
  const token = process.env.FOOTBALLDATA_KEY;
  if (!token) {
    console.error('❌ Falta FOOTBALLDATA_KEY en Settings → Secrets → Actions.');
    process.exit(1);
  }

  // Pedimos todos los SCHEDULED (la API devuelve por proximidad). Luego recortamos a 20.
  const url = `${API_URL}?status=SCHEDULED`;
  console.log('ℹ️ Pidiendo:', url);

  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Error API ${res.status}: ${txt}`);
    process.exit(1);
  }

  const data = await res.json();
  const all = (data.matches || [])
    .filter(Boolean)
    .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate));

  // Nos quedamos con los 20 próximos
  const next = all.slice(0, 20).map(m => ({
    fecha: formatLocal(m.utcDate),
    local: m.homeTeam?.name || '',
    visitante: m.awayTeam?.name || '',
    localCrest: m.homeTeam?.crest || '',
    visitanteCrest: m.awayTeam?.crest || '',
    liga: m.competition?.name || 'LaLiga'
  }));

  fs.writeFileSync('fixtures.json', JSON.stringify(next, null, 2), 'utf-8');
  console.log(`✅ Guardados ${next.length} partidos en fixtures.json (formato plano).`);
}

run().catch(e => { console.error('❌ Error general:', e); process.exit(1); });
