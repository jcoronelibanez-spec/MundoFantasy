// scripts/update-fixtures.js
import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.APIFOOTBALL_KEY;
const LEAGUE_ID = 140; // LaLiga (España)
const SEASON = 2024;   // Temporada actual

async function fetchFixtures() {
  const url = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}&next=10`;
  
  const response = await fetch(url, {
    headers: {
      "x-apisports-key": API_KEY,
    },
  });

  const data = await response.json();

  if (!data.response) {
    throw new Error("No se pudo obtener la información de los partidos.");
  }

  const fixtures = data.response.map((match) => ({
    date: match.fixture.date,
    home: match.teams.home.name,
    away: match.teams.away.name,
    venue: match.fixture.venue.name,
  }));

  fs.writeFileSync("data/fixtures.json", JSON.stringify(fixtures, null, 2));
  console.log("✅ fixtures.json actualizado correctamente.");
}

fetchFixtures().catch((err) => {
  console.error("❌ Error al actualizar fixtures:", err);
  process.exit(1);
});
