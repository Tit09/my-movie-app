
const API_KEY = '4e44d9029b1270a757cddc766a1bcb63';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const IMG_LG = 'https://image.tmdb.org/t/p/w780';
const LANG = 'fr-FR';

const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const clearBtn = document.getElementById('clear-btn');
const countEl = document.getElementById('result-count');
const sectionName = document.getElementById('section-name');

const modalBack = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

let currentEndpoint = 'popular';
let searchTimer = null;
let genres = {};

const sectionLabels = {
    popular: 'Films Populaires',
    now_playing: 'À l\'affiche',
    top_rated: 'Les Mieux Notés',
    upcoming: 'Bientôt au Cinéma',
    search: 'Résultats de Recherche'
};

async function loadGenres() {
    try {
        const r = await fetch(`${BASE}/genre/movie/list?api_key=${API_KEY}&language=${LANG}`);
        const d = await r.json();
        d.genres.forEach(g => { genres[g.id] = g.name; });
    } catch (e) { console.warn('Genres not loaded'); }
}

function showSkeletons(n = 20) {
    grid.innerHTML = Array(n).fill(0).map((_, i) => `
      <div class="skeleton" style="animation-delay:${i * 40}ms">
        <div class="sk-poster"></div>
        <div class="sk-info">
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>
      </div>`).join('');
}

function renderCards(movies) {
    countEl.textContent = movies.length + ' films';
    if (!movies.length) {
        grid.innerHTML = `<div class="empty-state">
        <div class="big">🎬</div>
        <p>Aucun film trouvé pour <strong>"${searchInput.value}"</strong></p>
      </div>`;
        return;
    }

    grid.innerHTML = movies.map((m, i) => {
        const poster = m.poster_path ? `${IMG}${m.poster_path}` : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect fill="%230d1117" width="200" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23333" font-size="48">🎬</text></svg>';
        const score = m.vote_average ? m.vote_average.toFixed(1) : '—';
        const year = m.release_date ? m.release_date.slice(0, 4) : '—';

        return `
        <div class="card" style="animation-delay:${Math.min(i, 15) * 50}ms" data-id="${m.id}">
          <div class="card-poster">
            <img src="${poster}" alt="${m.title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%230d1117%22 width=%22200%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23333%22 font-size=%2248%22>🎬</text></svg>'"/>
            <div class="card-overlay"></div>
            <div class="score">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              <span class="score-val">${score}</span>
            </div>
          </div>
          <div class="card-info">
            <div class="card-title">${m.title}</div>
            <div class="card-meta">
              <span class="card-year">${year}</span>
              <span class="card-lang">${m.original_language}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.card').forEach(c =>
        c.addEventListener('click', () => openModal(+c.dataset.id))
    );
}

async function fetchMovies(endpoint) {
    showSkeletons();
    sectionName.textContent = sectionLabels[endpoint] || 'Films';
    try {
        const r = await fetch(`${BASE}/movie/${endpoint}?api_key=${API_KEY}&language=${LANG}&page=1`);
        const d = await r.json();
        renderCards(d.results || []);
    } catch (e) {
        grid.innerHTML = `<div class="empty-state">
        <div class="big">⚠️</div>
        <p>Erreur de chargement. Vérifie ta connexion.</p>
      </div>`;
    }
}

async function searchMovies(q) {
    showSkeletons(12);
    sectionName.textContent = sectionLabels.search;
    try {
        const r = await fetch(`${BASE}/search/movie?api_key=${API_KEY}&language=${LANG}&query=${encodeURIComponent(q)}&page=1`);
        const d = await r.json();
        renderCards(d.results || []);
    } catch (e) {
        grid.innerHTML = `<div class="empty-state"><div class="big">⚠️</div><p>Erreur de recherche.</p></div>`;
    }
}

async function openModal(id) {
    try {
        const r = await fetch(`${BASE}/movie/${id}?api_key=${API_KEY}&language=${LANG}`);
        const m = await r.json();

        document.getElementById('modal-poster').src = m.poster_path ? `${IMG_LG}${m.poster_path}` : '';
        document.getElementById('modal-title').textContent = m.title;
        document.getElementById('modal-score-val').textContent = m.vote_average?.toFixed(1) + ' / 10';
        document.getElementById('modal-votes').textContent = `(${(m.vote_count || 0).toLocaleString()} votes)`;
        document.getElementById('modal-overview').textContent = m.overview || 'Aucun synopsis disponible.';
        document.getElementById('modal-tags').innerHTML = (m.genres || []).map(g =>
            `<span class="tag">${g.name}</span>`
        ).join('') + (m.release_date ? `<span class="tag">📅 ${m.release_date.slice(0, 4)}</span>` : '')
            + (m.runtime ? `<span class="tag">⏱ ${m.runtime} min</span>` : '');

        modalBack.classList.add('open');
        document.body.style.overflow = 'hidden';
    } catch (e) { console.error(e); }
}

function closeModal() {
    modalBack.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalBack.addEventListener('click', e => { if (e.target === modalBack) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentEndpoint = btn.dataset.endpoint;
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        fetchMovies(currentEndpoint);
    });
});

searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    clearBtn.classList.toggle('visible', q.length > 0);
    clearTimeout(searchTimer);
    if (q.length === 0) {
        fetchMovies(currentEndpoint);
    } else if (q.length >= 2) {
        searchTimer = setTimeout(() => searchMovies(q), 400);
    }
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    fetchMovies(currentEndpoint);
    searchInput.focus();
});

(async () => {
    await loadGenres();
    fetchMovies('popular');
})();
