async function loadFixtures() {
  try {
    const res = await fetch('fixtures.json?v=' + Date.now(), { cache: 'no-store' });
    const list = await res.json();

    const box = document.getElementById('fixtures');
    if (!box) return;

    if (!Array.isArray(list) || list.length === 0) {
      box.innerHTML = `<p class="text-gray-600">No hay partidos programados.</p>`;
      return;
    }

    box.innerHTML = list.map(m => `
      <div class="card p-4 hover:shadow transition">
        <div class="text-xs text-gray-500">${m.liga || 'LaLiga'}</div>
        <div class="text-lg font-semibold mt-1">${m.local} <span class="text-gray-400">vs</span> ${m.visitante}</div>
        <div class="text-sm text-gray-600">${m.fecha}${m.estadio ? ' · ' + m.estadio : ''}</div>
      </div>
    `).join('');
  } catch (e) {
    console.error('❌ Error cargando fixtures:', e);
  }
}
document.addEventListener('DOMContentLoaded', loadFixtures);
