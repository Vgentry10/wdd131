let allBooks = [];
let activeBook = null;
let previousFocus = null;
let toastTimer;
let isGridView = true;

let currentFilter = {
  genre: '',
  status: '',
  sort: 'date-desc',
  search: ''
};

const LS_OVERRIDES = 'yearreads_overrides';
const LS_THEME = 'yearreads_theme';
const LS_VIEW = 'yearreads_view';

const $ = id => document.getElementById(id);

const elements = {
  themeToggle: $('themeToggle'),
  toast: $('toast'),
  featuredGrid: $('featuredGrid'),
  recentGrid: $('recentGrid'),
  carouselTrack: $('carouselTrack'),
  notesList: $('notesList'),
  booksSection: $('booksSection'),
  resultsCount: $('resultsCount'),
  genreFilter: $('genreFilter'),
  sortSelect: $('sortSelect'),
  searchInput: $('searchInput'),
  titleSuggestions: $('titleSuggestions'),
  viewToggle: $('viewToggle'),
  detailModal: $('detailModal'),
  modalCover: $('modalCover'),
  modalTitle: $('modalTitle'),
  modalAuthor: $('modalAuthor'),
  modalGenre: $('modalGenre'),
  notesArea: $('notesArea'),
  externalLink: $('externalLink'),
  progressRange: $('progressRange'),
  progressVal: $('progressVal'),
  ratingStars: $('ratingStars'),
  markFinishedBtn: $('markFinishedBtn'),
  saveBtn: $('saveBtn'),
  modalClose: $('modalClose'),
  addBookBtn: $('addBookBtn'),
  quickAddBtn: $('quickAddBtn'),
  browseBtn: $('browseBtn'),
  clearFiltersBtn: $('clearFiltersBtn'),
  allBooksAnchor: $('allBooks')
};

const modalPanel = elements.detailModal.querySelector('.modal-panel');
const modalBackdrop = elements.detailModal.querySelector('.modal-backdrop');
const statusButtons = [...document.querySelectorAll('.statusBtns button')];

function getOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_OVERRIDES)) || {};
  } catch {
    return {};
  }
}

function saveOverride(id, data) {
  const overrides = getOverrides();
  overrides[id] = { ...overrides[id], ...data };
  localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
}

function applyOverrides(books) {
  const overrides = getOverrides();
  return books.map(book => (overrides[book.id] ? { ...book, ...overrides[book.id] } : book));
}

function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  elements.themeToggle.setAttribute('aria-pressed', String(dark));
  elements.themeToggle.textContent = dark ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem(LS_THEME, dark ? 'dark' : 'light');
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2800);
}

function buildStars(container, rating, onChange) {
  container.innerHTML = '';

  for (let i = 1; i <= 5; i += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `star-btn${i <= rating ? ' filled' : ''}`;
    button.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
    button.textContent = i <= rating ? '★' : '☆';

    button.addEventListener('click', () => {
      onChange(i);
      buildStars(container, i, onChange);
    });

    container.appendChild(button);
  }
}

function statusClass(status) {
  if (status === 'Finished') return 'finished';
  if (status === 'Reading') return 'reading';
  return 'toread';
}

function buildCard(book) {
  const card = document.createElement('article');
  const stars = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
  const showProgress = book.status !== 'Finished';

  card.className = 'book-card';
  card.tabIndex = 0;
  card.dataset.id = String(book.id);

  card.innerHTML = `
    <img class="card-cover" src="${book.cover}" alt="${book.title} cover" loading="lazy" />
    <div class="card-body">
      <span class="card-genre">${book.genre}</span>
      <h3 class="card-title">${book.title}</h3>
      <p class="card-author">${book.author}</p>
      <div class="card-rating" aria-label="${book.rating} out of 5 stars">${stars}</div>
      <span class="card-status ${statusClass(book.status)}">${book.status}</span>
      ${showProgress
        ? `<div class="card-progress"><div class="card-progress-bar" style="width:${book.progress}%"></div></div>`
        : ''}
    </div>
  `;

  const open = () => openModal(book);
  card.addEventListener('click', open);
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return card;
}

function renderFeatured(books) {
  elements.featuredGrid.innerHTML = '';
  books
    .filter(book => book.rating === 5 && book.status === 'Finished')
    .slice(0, 3)
    .forEach(book => elements.featuredGrid.appendChild(buildCard(book)));
}

function renderRecent(books) {
  elements.recentGrid.innerHTML = '';
  [...books]
    .sort((a, b) => b.year - a.year || b.id - a.id)
    .slice(0, 3)
    .forEach(book => elements.recentGrid.appendChild(buildCard(book)));
}

function renderCarousel(books) {
  elements.carouselTrack.innerHTML = '';
  books
    .filter(book => book.rating >= 4)
    .slice(0, 6)
    .forEach(book => {
      const image = document.createElement('img');
      image.src = book.cover;
      image.alt = `${book.title} cover`;
      image.loading = 'lazy';
      image.title = book.title;
      image.addEventListener('click', () => openModal(book));
      elements.carouselTrack.appendChild(image);
    });
}

function renderNotes(books) {
  elements.notesList.innerHTML = '';
  const booksWithNotes = books.filter(book => book.notes && book.notes.trim());

  if (!booksWithNotes.length) {
    elements.notesList.innerHTML = '<li class="no-notes">No highlights yet - add notes via a book card.</li>';
    return;
  }

  booksWithNotes.forEach(book => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `<strong>${book.title}</strong> <span>${book.notes}</span>`;
    listItem.style.cursor = 'pointer';
    listItem.addEventListener('click', () => openModal(book));
    elements.notesList.appendChild(listItem);
  });
}

function applyFilter() {
  const { genre, status, sort, search } = currentFilter;

  let filtered = [...allBooks];

  if (genre) filtered = filtered.filter(book => book.genre === genre);
  if (status) filtered = filtered.filter(book => book.status === status);

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.genre.toLowerCase().includes(query)
    );
  }

  filtered.sort((a, b) => {
    if (sort === 'rating-desc') return b.rating - a.rating;
    if (sort === 'title-asc') return a.title.localeCompare(b.title);
    return b.year - a.year || b.id - a.id;
  });

  return filtered;
}

function renderBooks() {
  const filtered = applyFilter();

  elements.resultsCount.textContent = `${filtered.length} book${filtered.length === 1 ? '' : 's'}`;
  elements.booksSection.innerHTML = '';
  elements.booksSection.className = isGridView ? 'grid-view' : 'list-view';

  if (!filtered.length) {
    elements.booksSection.innerHTML = '<p class="no-results">No books match your filters.</p>';
    return;
  }

  filtered.forEach(book => elements.booksSection.appendChild(buildCard(book)));
}

function populateGenreFilter(books) {
  const genres = [...new Set(books.map(book => book.genre))].sort();
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    elements.genreFilter.appendChild(option);
  });
}

function updateTypeahead() {
  elements.titleSuggestions.innerHTML = '';
  const query = currentFilter.search.toLowerCase();
  if (!query) return;

  allBooks
    .filter(book => book.title.toLowerCase().includes(query))
    .slice(0, 6)
    .forEach(book => {
      const option = document.createElement('option');
      option.value = book.title;
      elements.titleSuggestions.appendChild(option);
    });
}

function syncActiveBook() {
  const index = allBooks.findIndex(book => book.id === activeBook.id);
  if (index > -1) {
    allBooks[index] = { ...activeBook };
  }
}

function openModal(book) {
  activeBook = book;
  previousFocus = document.activeElement;

  elements.modalCover.src = book.cover;
  elements.modalCover.alt = `${book.title} cover`;
  elements.modalTitle.textContent = book.title;
  elements.modalAuthor.textContent = book.author;
  elements.modalGenre.textContent = book.genre;
  elements.notesArea.value = book.notes || '';
  elements.externalLink.href = book.link || '#';
  elements.progressRange.value = String(book.progress);
  elements.progressVal.textContent = `${book.progress}%`;
  elements.markFinishedBtn.textContent = book.status === 'Finished' ? 'Mark Unread' : 'Mark Finished';

  buildStars(elements.ratingStars, book.rating, newRating => {
    if (activeBook) activeBook.rating = newRating;
  });

  elements.detailModal.setAttribute('aria-hidden', 'false');
  elements.detailModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalPanel.focus();
}

function closeModal() {
  elements.detailModal.setAttribute('aria-hidden', 'true');
  elements.detailModal.classList.remove('open');
  document.body.style.overflow = '';
  activeBook = null;
  if (previousFocus) previousFocus.focus();
}

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

function resetFilters() {
  currentFilter = { genre: '', status: '', sort: 'date-desc', search: '' };
  elements.genreFilter.value = '';
  elements.sortSelect.value = 'date-desc';
  elements.searchInput.value = '';

  statusButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.status === '');
  });

  renderBooks();
}

function toggleView() {
  isGridView = !isGridView;
  elements.viewToggle.textContent = isGridView ? 'List View' : 'Grid View';
  localStorage.setItem(LS_VIEW, isGridView ? 'grid' : 'list');
  renderBooks();
}

function setupEventHandlers() {
  elements.themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme !== 'dark');
  });

  elements.saveBtn.addEventListener('click', () => {
    if (!activeBook) return;

    const notes = elements.notesArea.value.trim();
    const progress = Number(elements.progressRange.value);

    activeBook.notes = notes;
    activeBook.progress = progress;

    saveOverride(activeBook.id, {
      rating: activeBook.rating,
      notes,
      progress
    });

    syncActiveBook();
    renderBooks();
    renderNotes(allBooks);
    showToast('Saved!');
  });

  elements.markFinishedBtn.addEventListener('click', () => {
    if (!activeBook) return;

    const finishing = activeBook.status !== 'Finished';
    activeBook.status = finishing ? 'Finished' : 'To Read';
    activeBook.progress = finishing ? 100 : 0;

    elements.progressRange.value = String(activeBook.progress);
    elements.progressVal.textContent = `${activeBook.progress}%`;
    elements.markFinishedBtn.textContent = activeBook.status === 'Finished' ? 'Mark Unread' : 'Mark Finished';

    saveOverride(activeBook.id, {
      status: activeBook.status,
      progress: activeBook.progress
    });

    syncActiveBook();
    renderBooks();
    renderFeatured(allBooks);
    showToast(`Marked as ${activeBook.status}!`);
  });

  elements.progressRange.addEventListener('input', event => {
    elements.progressVal.textContent = `${event.target.value}%`;
    if (activeBook) activeBook.progress = Number(event.target.value);
  });

  elements.modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && elements.detailModal.classList.contains('open')) {
      closeModal();
    }
  });

  elements.detailModal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;

    const focusable = [
      ...elements.detailModal.querySelectorAll(
        'button, input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      )
    ];

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  elements.addBookBtn.addEventListener('click', openAddModal);
  elements.quickAddBtn.addEventListener('click', openAddModal);

  elements.browseBtn.addEventListener('click', () => {
    elements.allBooksAnchor.scrollIntoView({ behavior: 'smooth' });
  });

  elements.genreFilter.addEventListener('change', event => {
    currentFilter.genre = event.target.value;
    renderBooks();
  });

  elements.sortSelect.addEventListener('change', event => {
    currentFilter.sort = event.target.value;
    renderBooks();
  });

  elements.clearFiltersBtn.addEventListener('click', resetFilters);

  statusButtons.forEach(button => {
    button.addEventListener('click', () => {
      statusButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      currentFilter.status = button.dataset.status;
      renderBooks();
    });
  });

  elements.searchInput.addEventListener('input', event => {
    currentFilter.search = event.target.value.trim();
    updateTypeahead();
    renderBooks();
  });

  elements.viewToggle.addEventListener('click', toggleView);
}

async function init() {
  setTheme(localStorage.getItem(LS_THEME) === 'dark');

  if (localStorage.getItem(LS_VIEW) === 'list') {
    isGridView = false;
    elements.viewToggle.textContent = 'Grid View';
  }

  const response = await fetch('books.json');
  const rawBooks = await response.json();
  allBooks = applyOverrides(rawBooks);

  populateGenreFilter(allBooks);
  renderCarousel(allBooks);
  renderFeatured(allBooks);
  renderRecent(allBooks);
  renderBooks();
  renderNotes(allBooks);
}

setupEventHandlers();
init();
