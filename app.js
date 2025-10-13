// Transición rápida en clics internos (toque "Apple")
document.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', e => {
    const url = a.getAttribute('href');
    if (!url || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('#')) return;
    document.body.style.opacity = '0.9';
    document.body.style.transition = 'opacity .18s ease';
    setTimeout(() => { window.location.href = url; }, 120);
  });
});

// Render de Próxima jornada
async function loadFixtures() {
  try {
    const res = await fetch('data/fixtures.json', { cache: 'no-store' });
    const list = await res.json();
    const box = document.getElementById('fixtures');
    if (!box) return;

    box.innerHTML = list.map(m => `
      <div class="card p-4 hover:shadow-lg transition">
        <div class="text-xs text-gray-500">${m.liga || 'Liga'}</div>
        <div class="text-lg font-semibold mt-1">${m.local} <span class="text-gray-500">vs</span> ${m.visitante}</div>
        <div class="text-sm text-gray-600 mt-1">${m.fecha}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error fixtures:', err);
  }
}

// Render de noticias
async function loadNews() {
  try {
    const res = await fetch('data/news.json', { cache: 'no-store' });
    const news = await res.json();
    const box = document.getElementById('news');
    if (!box) return;

    box.innerHTML = news.map(n => `
      <article class="card p-4 hover:shadow-lg transition">
        <h3 class="font-semibold">${n.titulo}</h3>
        <p class="text-sm text-gray-600 mt-1">${n.resumen}</p>
        <div class="text-xs text-gray-500 mt-2">${n.fecha}</div>
        <a href="${n.url}" class="text-green-700 font-semibold text-sm mt-3 inline-block">Leer más →</a>
      </article>
    `).join('');
  } catch (err) {
    console.error('Error news:', err);
  }
}

loadFixtures();
loadNews();