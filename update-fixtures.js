// update-fixtures.js
// Node 20 trae fetch global: NO uses node-fetch
const fs = require('fs');

const API_URL   = 'https://v3.football.api-sports.io/fixtures';
const LEAGUE_ID = 140; // LaLiga (Primera)
const TIMEZONE  = 'Europe/Madrid';

// season automática: si >= julio, año actual; si no, año-1
function getCurrentSeason() {
  const now = new Date();
  const m = now.getUTCMonth() + 1;
  const y = now.getUTCFullYear();
  return m >= 7 ? y : y - 1;
}
const SEASON = getCurrentSeason();

// Formato "YYYY-MM-DD HH:mm" en horario España
function formatDate(dtISO, tz = TIMEZONE) {
  const d = new Date(dtISO);
  const p = new Intl.DateTimeFormat('es-ES', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

async function run() {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) {
    console.error('❌ Falta el secreto APIFOOTBALL_KEY en GitHub → Settings → Secrets → Actions');
    process.exit(1);
  }

  // Trae los próximos 20 partidos de LaLiga de la temporada actual
  const url = `${API_URL}?league=${LEAGUE_ID}&season=${SEASON}&next=20`;
  console.log('ℹ️ URL:', url.replace(/season=\d+/, `season=${SEASON}`));

  const res = await fetch(url, { headers: { 'x-apisports-key': key } });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Error API: ${res.status} ${res.statusText}\n${txt}`);
    process.exit(1);
  }

  const data = await res.json();
  const fixtures = (data.response || [])
    .filter(x => String(x.league?.id) === String(LEAGUE_ID) && String(x.league?.season) === String(SEASON))
    .sort((a,b) => new Date(a.fixture.date) - new Date(b.fixture.date))
    .map(x => ({
      local: x.teams.home.name,
      visitante: x.teams.away.name,
      fecha: formatDate(x.fixture.date),
      liga: x.league.name,
      estadio: x.fixture.venue?.name || ''
    }));

  fs.writeFileSync('fixtures.json', JSON.stringify(fixtures, null, 2), 'utf-8');
  console.log(`✅ Season ${SEASON} | Escribidos ${fixtures.length} partidos en fixtures.json`);
}

run().catch(e => {
  console.error('❌ Error general:', e);
  process.exit(1);
});
