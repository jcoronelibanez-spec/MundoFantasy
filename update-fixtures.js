// update-fixtures.js
// Fuente: football-data.org v4 (competición PD = LaLiga)
// Node 20 trae fetch global → no necesitas instalar nada

const fs = require('fs');

const API_URL  = 'https://api.football-data.org/v4/competitions/PD/matches';
const TIMEZONE = 'Europe/Madrid'; // formateo local

// rango: hoy → hoy + 14 días (ajusta si quieres)
function rangeNextDays(days = 14) {
  const now = new Date();           // ahora (UTC)
  const to  = new Date(now);
  to.setUTCDate(to.getUTCDate() + days);
  const d = (x) => x.toISOString().slice(0, 10); // YYYY-MM-DD
  return { from: d(now), to: d(to) };
}

// "YYYY-MM-DD HH:mm" en horario España
function formatLocal(iso, tz = TIMEZONE) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

async function run() {
  const token = process.env.FOOTBALLDATA_KEY;
  if (!token) {
    console.error('❌ Falta FOOTBALLDATA_KEY en Settings → Secrets → Actions.');
    process.exit(1);
  }

  const { from, to } = rangeNextDays(14);
  const url = `${API_URL}?status=SCHEDULED&dateFrom=${from}&dateTo=${to}`;
  console.log('ℹ️ Pidiendo:', url);

  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Error API ${res.status}: ${txt}`);
    process.exit(1);
  }

  const data = await res.json();
  const matches = data.matches || [];

  const fixtures = matches
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map(m => ({
      local:     m.homeTeam?.name,
      visitante: m.awayTeam?.name,
      fecha:     formatLocal(m.utcDate),
      liga:      m.competition?.name || 'LaLiga'
      // football-data no siempre trae estadio en este endpoint
    }));

  fs.writeFileSync('fixtures.json', JSON.stringify(fixtures, null, 2), 'utf-8');
  console.log(`✅ Guardados ${fixtures.length} partidos en fixtures.json`);
}

run().catch(e => { console.error('❌ Error general:', e); process.exit(1); });
