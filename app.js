// app.js — render próxima jornada desde fixtures.json
function dayLabel(yyyy_mm_dd) {
  const [y,m,d] = yyyy_mm_dd.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })
           .replace(/^\w/, c => c.toUpperCase()); // capitaliza
}

async function loadFixtures() {
  try {
    const res = await fetch('fixtures.json?v=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();

    const box = document.getElementById('fixtures');
    if (!box) return;

    if (!data || !Array.isArray(data.days) || data.days.length === 0) {
      box.innerHTML = `<p class="empty">Aún no hay partidos programados.</p>`;
      return;
    }

    const header = document.getElementById('md-header');
    if (header && data.matchday != null) {
      header.textContent = `Jornada ${data.matchday}`;
    }

    box.innerHTML = data.days.map(day => `
      <div class="day-group">
        <div class="day-title">${dayLabel(day.date)} <span>${day.date}</span></div>
        <div class="grid">
          ${day.matches.map(m => `
            <div class="match-card">
              <div class="time">${m.hora}</div>
              <div class="teams">
                <div class="team">
                  <img src="${m.localCrest}" alt="${m.local}" loading="lazy"/>
                  <span>${m.local}</span>
                </div>
                <span class="vs">vs</span>
                <div class="team">
                  <img src="${m.visitanteCrest}" alt="${m.visitante}" loading="lazy"/>
                  <span>${m.visitante}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', loadFixtures);
