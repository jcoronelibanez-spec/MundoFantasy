// update-fixtures.js
const fs = require("fs");
const fetch = require("node-fetch");

const API_KEY = process.env.APIFOOTBALL_KEY;
const LEAGUE_ID = 140; // LaLiga (España)
const SEASON = 2024;   // Temporada actual

async function fetchFixtures() {
  const url = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}&next=20`;

  const response = await fetch(url, {
    headers: { "x-apisports-key": API_KEY },
  });

  if (!response.ok) {
    console.error("❌ Error al obtener datos:", response.status, await response.text());
    process.exit(1);
  }

  const data = await response.json();

  if (!data.response) {
    console.error("❌ No se pudieron obtener los partidos.");
    process.exit(1);
  }

  const fixtures = data.response.map((match) => ({
    local: match.teams.home.name,
    visitante: match.teams.away.name,
    fecha: new Date(match.fixture.date).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Madrid",
    }),
    estadio: match.fixture.venue.name,
  }));

  fs.writeFileSync("fixtures.json", JSON.stringify(fixtures, null, 2));
  console.log("✅ fixtures.json actualizado correctamente.");
}

fetchFixtures().catch((err) => {
  console.error("❌ Error general:", err);
  process.exit(1);
});
