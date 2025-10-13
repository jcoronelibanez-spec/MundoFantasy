// app.js
async function loadFixtures() {
  try {
    const res = await fetch("fixtures.json?v=" + Date.now(), { cache: "no-store" });
    const list = await res.json();

    const container = document.getElementById("fixtures");
    if (!container) return;

    if (!list.length) {
      container.innerHTML = `<p>No hay partidos disponibles por ahora.</p>`;
      return;
    }

    container.innerHTML = list
      .map(
        (m) => `
        <div class="match-card">
          <h3>${m.local} vs ${m.visitante}</h3>
          <p>${m.fecha}</p>
          <p class="venue">${m.estadio}</p>
        </div>
      `
      )
      .join("");
  } catch (e) {
    console.error("❌ Error cargando partidos:", e);
  }
}

document.addEventListener("DOMContentLoaded", loadFixtures);
