// ─── State ────────────────────────────────────────────────────────────────────
let allBooks = [];
let activeBook = null;
let currentFilter = { genre: '', status: '', sort: 'date-desc', search: '' };
let isGridView = true;

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
const LS_OVERRIDES = 'yearreads_overrides';
const LS_THEME = 'yearreads_theme';
const LS_VIEW = 'yearreads_view';

function getOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_OVERRIDES)) || {}; }
  catch { return {}; }
}

function saveOverride(id, data) {
  const overrides = getOverrides();
  overrides[id] = { ...overrides[id], ...data };
  localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
}

function applyOverrides(books) {
  const overrides = getOverrides();
  return books.map(b => overrides[b.id] ? { ...b, ...overrides[b.id] } : b);
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');

function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.textContent = dark ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem(LS_THEME, dark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme !== 'dark');
});

// ─── Toast ────────────────────────────────────────────────────────────────────
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── Star rating builder ──────────────────────────────────────────────────────
function buildStars(container, rating, onChange) {
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
    btn.className = 'star-btn' + (i <= rating ? ' filled' : '');
    btn.textContent = i <= rating ? '★' : '☆';
    btn.addEventListener('click', () => {
      onChange(i);
      buildStars(container, i, onChange);
    });
    container.appendChild(btn);
  }
}

// ─── Card builder ─────────────────────────────────────────────────────────────
function statusClass(status) {
  if (status === 'Finished') return 'finished';
  if (status === 'Reading') return 'reading';
  return 'toread';
}

function buildCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.setAttribute('tabindex', '0');
  card.dataset.id = book.id;

  const stars = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
  const progressBar = book.status !== 'Finished'
    ? `<div class="card-progress"><div class="card-progress-bar" style="width:${book.progress}%"></div></div>`
    : '';

  card.innerHTML = `
    <img class="card-cover" src="${book.cover}" alt="${book.title} cover" loading="lazy" />
    <div class="card-body">
      <span class="card-genre">${book.genre}</span>
      <h3 class="card-title">${book.title}</h3>
      <p class="card-author">${book.author}</p>
      <div class="card-rating" aria-label="${book.rating} out of 5 stars">${stars}</div>
      <span class="card-status ${statusClass(book.status)}">${book.status}</span>
      ${progressBar}
    </div>
  `;

  const open = () => openModal(book);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });

  return card;
}

// ─── Section renderers ───────────────────────────────────────────────────────
function renderFeatured(books) {
  const grid = document.getElementById('featuredGrid');
  grid.innerHTML = '';
  books
    .filter(b => b.rating === 5 && b.status === 'Finished')
    .slice(0, 3)
    .forEach(b => grid.appendChild(buildCard(b)));
}

function renderRecent(books) {
  const grid = document.getElementById('recentGrid');
  grid.innerHTML = '';
  [...books]
    .sort((a, b) => b.year - a.year || b.id - a.id)
    .slice(0, 3)
    .forEach(b => grid.appendChild(buildCard(b)));
}

function renderCarousel(books) {
  const track = document.getElementById('carouselTrack');
  track.innerHTML = '';
  books
    .filter(b => b.rating >= 4)
    .slice(0, 6)
    .forEach(b => {
      const img = document.createElement('img');
      img.src = b.cover;
      img.alt = `${b.title} cover`;
      img.loading = 'lazy';
      img.title = b.title;
      img.addEventListener('click', () => openModal(b));
      track.appendChild(img);
    });
}

function renderNotes(books) {
  const list = document.getElementById('notesList');
  list.innerHTML = '';
  const withNotes = books.filter(b => b.notes && b.notes.trim());
  if (!withNotes.length) {
    list.innerHTML = '<li class="no-notes">No highlights yet — add notes via a book card.</li>';
    return;
  }
  withNotes.forEach(b => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${b.title}</strong> <span>${b.notes}</span>`;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => openModal(b));
    list.appendChild(li);
  });
}

// ─── Filter / sort / search ───────────────────────────────────────────────────
function applyFilter() {
  const { genre, status, sort, search } = currentFilter;
  let filtered = [...allBooks];

  if (genre) filtered = filtered.filter(b => b.genre === genre);
  if (status) filtered = filtered.filter(b => b.status === status);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    if (sort === 'rating-desc') return b.rating - a.rating;
    if (sort === 'title-asc') return a.title.localeCompare(b.title);
    return b.year - a.year || b.id - a.id; // date-desc default
  });

  return filtered;
}

function renderBooks() {
  const section = document.getElementById('booksSection');
  const count = document.getElementById('resultsCount');
  const filtered = applyFilter();

  count.textContent = `${filtered.length} book${filtered.length !== 1 ? 's' : ''}`;
  section.innerHTML = '';
  section.className = isGridView ? 'grid-view' : 'list-view';

  if (!filtered.length) {
    section.innerHTML = '<p class="no-results">No books match your filters.</p>';
    return;
  }

  filtered.forEach(b => section.appendChild(buildCard(b)));
}

// ─── Genre filter population ──────────────────────────────────────────────────
function populateGenreFilter(books) {
  const select = document.getElementById('genreFilter');
  const genres = [...new Set(books.map(b => b.genre))].sort();
  genres.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    select.appendChild(opt);
  });
}

// ─── Typeahead suggestions ────────────────────────────────────────────────────
function updateTypeahead() {
  const dl = document.getElementById('titleSuggestions');
  dl.innerHTML = '';
  const q = currentFilter.search.toLowerCase();
  if (!q) return;
  allBooks
    .filter(b => b.title.toLowerCase().includes(q))
    .slice(0, 6)
    .forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.title;
      dl.appendChild(opt);
    });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const modal = document.getElementById('detailModal');
const modalPanel = modal.querySelector('.modal-panel');
let previousFocus = null;

function openModal(book) {
  activeBook = book;
  previousFocus = document.activeElement;

  document.getElementById('modalCover').src = book.cover;
  document.getElementById('modalCover').alt = `${book.title} cover`;
  document.getElementById('modalTitle').textContent = book.title;
  document.getElementById('modalAuthor').textContent = book.author;
  document.getElementById('modalGenre').textContent = book.genre;
  document.getElementById('notesArea').value = book.notes || '';
  document.getElementById('externalLink').href = book.link || '#';

  const progressRange = document.getElementById('progressRange');
  const progressVal = document.getElementById('progressVal');
  progressRange.value = book.progress;
  progressVal.textContent = `${book.progress}%`;

  buildStars(
    document.getElementById('ratingStars'),
    book.rating,
    newRating => { activeBook.rating = newRating; }
  );

  document.getElementById('markFinishedBtn').textContent =
    book.status === 'Finished' ? 'Mark Unread' : 'Mark Finished';

  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalPanel.focus();
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  activeBook = null;
  if (previousFocus) previousFocus.focus();
}

// Save notes, rating, and progress
document.getElementById('saveBtn').addEventListener('click', () => {
  if (!activeBook) return;
  const notes = document.getElementById('notesArea').value.trim();
  const progress = Number(document.getElementById('progressRange').value);
  activeBook.notes = notes;
  activeBook.progress = progress;
  saveOverride(activeBook.id, { rating: activeBook.rating, notes, progress });

  const idx = allBooks.findIndex(b => b.id === activeBook.id);
  if (idx > -1) allBooks[idx] = { ...activeBook };

  renderBooks();
  renderNotes(allBooks);
  showToast('Saved!');
});

// Mark Finished / Unread toggle
document.getElementById('markFinishedBtn').addEventListener('click', () => {
  if (!activeBook) return;
  const finishing = activeBook.status !== 'Finished';
  activeBook.status = finishing ? 'Finished' : 'To Read';
  activeBook.progress = finishing ? 100 : 0;

  document.getElementById('progressRange').value = activeBook.progress;
  document.getElementById('progressVal').textContent = `${activeBook.progress}%`;
  document.getElementById('markFinishedBtn').textContent =
    activeBook.status === 'Finished' ? 'Mark Unread' : 'Mark Finished';

  saveOverride(activeBook.id, { status: activeBook.status, progress: activeBook.progress });
  const idx = allBooks.findIndex(b => b.id === activeBook.id);
  if (idx > -1) allBooks[idx] = { ...activeBook };

  renderBooks();
  renderFeatured(allBooks);
  showToast(`Marked as ${activeBook.status}!`);
});

// Progress slider live update
document.getElementById('progressRange').addEventListener('input', e => {
  document.getElementById('progressVal').textContent = `${e.target.value}%`;
  if (activeBook) activeBook.progress = Number(e.target.value);
});

// Close triggers
document.getElementById('modalClose').addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

// Focus trap inside modal
modal.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusable = [
    ...modal.querySelectorAll(
      'button, input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )
  ];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// ─── Add / Quick-Add Book ─────────────────────────────────────────────────────
function openAddModal() {
  const newBook = {
    id: Date.now(),
    title: 'New Book',
    author: '',
    year: new Date().getFullYear(),
    genre: '',
    rating: 0,
    status: 'To Read',
    progress: 0,
    cover: 'images/klara.svg',
    notes: '',
    summary: '',
    link: ''
  };
  allBooks.push(newBook);
  openModal(newBook);
}

document.getElementById('addBookBtn').addEventListener('click', openAddModal);
document.getElementById('quickAddBtn').addEventListener('click', openAddModal);

// ─── Browse button ────────────────────────────────────────────────────────────
document.getElementById('browseBtn').addEventListener('click', () => {
  document.getElementById('allBooks').scrollIntoView({ behavior: 'smooth' });
});

// ─── Filter controls ──────────────────────────────────────────────────────────
document.getElementById('genreFilter').addEventListener('change', e => {
  currentFilter.genre = e.target.value;
  renderBooks();
});

document.getElementById('sortSelect').addEventListener('change', e => {
  currentFilter.sort = e.target.value;
  renderBooks();
});

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  currentFilter = { genre: '', status: '', sort: 'date-desc', search: '' };
  document.getElementById('genreFilter').value = '';
  document.getElementById('sortSelect').value = 'date-desc';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.statusBtns button').forEach(b => {
    b.classList.toggle('active', b.dataset.status === '');
  });
  renderBooks();
});

document.querySelectorAll('.statusBtns button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.statusBtns button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter.status = btn.dataset.status;
    renderBooks();
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', e => {
  currentFilter.search = e.target.value.trim();
  updateTypeahead();
  renderBooks();
});

// ─── View toggle ──────────────────────────────────────────────────────────────
document.getElementById('viewToggle').addEventListener('click', () => {
  isGridView = !isGridView;
  document.getElementById('viewToggle').textContent = isGridView ? 'List View' : 'Grid View';
  localStorage.setItem(LS_VIEW, isGridView ? 'grid' : 'list');
  renderBooks();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // Restore saved theme
  setTheme(localStorage.getItem(LS_THEME) === 'dark');

  // Restore saved view preference
  if (localStorage.getItem(LS_VIEW) === 'list') {
    isGridView = false;
    document.getElementById('viewToggle').textContent = 'Grid View';
  }

  // Fetch and apply books
  const res = await fetch('books.json');
  const raw = await res.json();
  allBooks = applyOverrides(raw);

  populateGenreFilter(allBooks);
  renderCarousel(allBooks);
  renderFeatured(allBooks);
  renderRecent(allBooks);
  renderBooks();
  renderNotes(allBooks);
}

init();
