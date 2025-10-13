// scripts/update-fixtures.js
const fs = require('fs');
const path = require('path');

const API_URL = 'https://v3.football.api-sports.io/fixtures';
const LEAGUE_ID = 140; // LaLiga
const TIMEZONE = 'Europe/Madrid';

// Season automática (julio o después = año actual; si no, año anterior)
function getCurrentSeason() {
  const now = new Date();
  const m = now.getUTCMonth() + 1;
  const y = now.getUTCFullYear();
  return m >= 7 ? y : y - 1;
}
const SEASON = getCurrentSeason();

// Solo próximo fin de semana
const ONLY_NEXT_WEEKEND = true;

function formatDate(dtISO, tz = TIMEZONE) {
  const d = new Date(dtISO);
  const p = new Intl.DateTimeFormat('es-ES', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

function nextWeekendRangeUTC() {
  const now = new Date();
  const dow = now.getUTCDay(); // 0=dom
  const daysToFriday = (5 - dow + 7) % 7 || 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToFriday, 0, 0, 0));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 2, 23, 59, 59));
  return { fromISO: start.toISOString().slice(0,19), toISO: end.toISOString().slice(0,19) };
}

async function run() {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) { console.error('Falta APIFOOTBALL_KEY'); process.exit(1); }

  let url;
  if (ONLY_NEXT_WEEKEND) {
    const { fromISO, toISO } = nextWeekendRangeUTC();
    url = `${API_URL}?league=${LEAGUE_ID}&season=${SEASON}&from=${fromISO}&to=${toISO}`;
  } else {
    url = `${API_URL}?league=${LEAGUE_ID}&season=${SEASON}&next=20`;
  }

  const res = await fetch(url, { headers: { 'x-apisports-key': key } });
  if (!res.ok) {
    console.error('Error API:', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();

  const fixtures = (data.response || [])
    .filter(x => String(x.league?.id) === String(LEAGUE_ID) && String(x.league?.season) === String(SEASON))
    .sort((a,b) => new Date(a.fixture.date) - new Date(b.fixture.date))
    .map(x => ({
      local: x.teams.home.name,
      visitante: x.teams.away.name,
      fecha: formatDate(x.fixture.date, TIMEZONE),
      liga: x.league.name
    }));

  const out = path.join(process.cwd(), 'data', 'fixtures.json');
  fs.writeFileSync(out, JSON.stringify(fixtures, null, 2), 'utf-8');
  console.log(`✅ Season ${SEASON} | ${fixtures.length} partidos → ${out}`);
}

run().catch(e => { console.error(e); process.exit(1); });
