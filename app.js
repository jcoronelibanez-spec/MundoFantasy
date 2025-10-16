// app.js — renderiza array plano O estructura por días
function dayHeaderLabel(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })
           .replace(/^\w/, c => c.toUpperCase());
}

function renderArrayPlano(list, box, headerEl) {
  if (headerEl) headerEl.textContent = 'Próximos partidos';
  // Agrupar por "YYYY-MM-DD" (los 10 primeros chars de "YYYY-MM-DD HH:mm")
  const groups = {};
  for (const m of list) {
    const date = (m.fecha || '').slice(0, 10);
    if (!groups[date]) groups[date] = [];
    groups[date].push(m);
  }

  const html = Object.entries(groups).map(([date, matches]) => `
    <div class="day-group">
      <div class="day-title">${dayHeaderLabel(date)} <span>${date}</span></div>
      <div class="grid">
        ${matches.map(m => `
          <div class="match-card">
            <div class="time">${(m.fecha || '').slice(11)}</div>
            <div class="teams">
              <div class="team">
                <img src="${m.localCrest || ''}" alt="${m.local}" loading="lazy"/>
                <span>${m.local}</span>
              </div>
              <span class="vs">vs</span>
              <div class="team">
                <img src="${m.visitanteCrest || ''}" alt="${m.visitante}" loading="lazy"/>
                <span>${m.visitante}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  box.innerHTML = html || `<p class="empty">No hay partidos programados.</p>`;
}

function renderEstructuraDias(data, box, headerEl) {
  if (headerEl) headerEl.textContent = data.matchday != null ? `Jornada ${data.matchday}` : 'Próximos partidos';
  box.innerHTML = (data.days || []).map(day => `
    <div class="day-group">
      <div class="day-title">${dayHeaderLabel(day.date)} <span>${day.date}</span></div>
      <div class="grid">
        ${day.matches.map(m => `
          <div class="match-card">
            <div class="time">${m.hora || ''}</div>
            <div class="teams">
              <div class="team">
                <img src="${m.localCrest || ''}" alt="${m.local}" loading="lazy"/>
                <span>${m.local}</span>
              </div>
              <span class="vs">vs</span>
              <div class="team">
                <img src="${m.visitanteCrest || ''}" alt="${m.visitante}" loading="lazy"/>
                <span>${m.visitante}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

async function loadFixtures() {
  try {
    const res = await fetch('fixtures.json?v=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();

    const box = document.getElementById('fixtures');
    const headerEl = document.getElementById('md-header');
    if (!box) return;

    if (Array.isArray(data)) {
      renderArrayPlano(data, box, headerEl);
    } else if (data && Array.isArray(data.days)) {
      renderEstructuraDias(data, box, headerEl);
    } else {
      box.innerHTML = `<p class="empty">No hay partidos programados.</p>`;
    }
  } catch (e) {
    console.error(e);
  }
}
document.addEventListener('DOMContentLoaded', loadFixtures);
