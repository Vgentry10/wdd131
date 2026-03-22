// app.js (module)
const booksUrl = 'books.json'; // load this file
const booksSection = document.getElementById('booksSection');
const genreFilter = document.getElementById('genreFilter');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const viewToggle = document.getElementById('viewToggle');
const statusBtns = document.querySelectorAll('.statusBtns button');
const carouselTrack = document.getElementById('carouselTrack');
const toastEl = document.getElementById('toast');

const modal = document.getElementById('detailModal');
const modalBackdrop = modal.querySelector('.modal-backdrop');
const modalClose = document.getElementById('modalClose');
const modalCover = document.getElementById('modalCover');
const modalTitle = document.getElementById('modalTitle');
const modalAuthor = document.getElementById('modalAuthor');
const modalGenre = document.getElementById('modalGenre');
const ratingStars = document.getElementById('ratingStars');
const progressRange = document.getElementById('progressRange');
const progressVal = document.getElementById('progressVal');
const notesArea = document.getElementById('notesArea');
const saveBtn = document.getElementById('saveBtn');
const externalLink = document.getElementById('externalLink');

let books = [];
let filtered = [];
let currentBook = null;
let viewMode = localStorage.getItem('yr_view') || 'grid';
let theme = localStorage.getItem('yr_theme') || 'light';

// Theme helper: put near top of app.js or in theme.js
const THEME_KEY = 'yr_theme'; // storage key
const themeToggleBtn = document.getElementById('themeToggle'); // button in DOM

// Apply theme to root element
function applyTheme(theme) {
  if (!theme) return;
  document.documentElement.setAttribute('data-theme', theme);
  // update aria/visual state on toggle button
  if (themeToggleBtn) {
    const isDark = theme === 'dark';
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    themeToggleBtn.setAttribute('aria-pressed', String(isDark));
  }
}

// Decide initial theme: localStorage -> prefers-color-scheme -> default 'light'
function resolveInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  if (mq && mq.matches) return 'dark';
  return 'light';
}

// Toggle theme and persist
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || resolveInitialTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

// Initialize theme on page load
function initTheme() {
  const initial = resolveInitialTheme();
  applyTheme(initial);

  // Wire up button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

// utilities
const showToast = (text, ms = 2000) => {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), ms);
};
const saveLocal = (id, data) => {
  const key = `yr_book_${id}`;
  localStorage.setItem(key, JSON.stringify(data));
};
const loadLocal = (id) => {
  const key = `yr_book_${id}`;
  const s = localStorage.getItem(key);
  return s ? JSON.parse(s) : null;
};
const persistView = () => { localStorage.setItem('yr_view', viewMode); }
const persistTheme = () => { localStorage.setItem('yr_theme', theme); document.documentElement.dataset.theme = theme; }

// load data
async function loadBooks(){
  const res = await fetch(booksUrl);
  books = await res.json();
  // apply persisted per-book data
  books = books.map(b=>{
    const p = loadLocal(b.id);
    return p ? {...b, ...p} : b;
  });
  initUI();
}
function initUI(){
  populateGenres();
  renderCarousel();
  applyView();
  applyFilters();
  buildTypeahead();
  // restore theme
  persistTheme();
  // wire events
  searchInput.addEventListener('input', onSearch);
  sortSelect.addEventListener('change', applyFilters);
  genreFilter.addEventListener('change', applyFilters);
  viewToggle.addEventListener('click', toggleView);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  statusBtns.forEach(b=>b.addEventListener('click', e=>{
    statusBtns.forEach(x=>x.classList.remove('active'));
    e.target.classList.add('active');
    applyFilters();
  }));
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  saveBtn.addEventListener('click', onSave);
  progressRange.addEventListener('input', ()=>progressVal.textContent = progressRange.value + '%');
  document.addEventListener('keydown', onKeyDown);
}

// filters / search / sort
function populateGenres(){
  const genres = Array.from(new Set(books.map(b=>b.genre).filter(Boolean))).sort();
  genres.forEach(g=>{
    const o = document.createElement('option'); o.value = g; o.textContent = g;
    genreFilter.appendChild(o);
  });
}
function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const genre = genreFilter.value;
  const status = document.querySelector('.statusBtns .active')?.dataset.status || '';
  filtered = books.filter(b=>{
    if(genre && b.genre !== genre) return false;
    if(status && b.status !== status) return false;
    if(q){
      return `${b.title} ${b.author} ${b.notes}`.toLowerCase().includes(q);
    }
    return true;
  });
  // sort
  const s = sortSelect.value;
  filtered.sort((a,b)=>{
    if(s === 'rating-desc') return (b.rating||0) - (a.rating||0);
    if(s === 'title-asc') return a.title.localeCompare(b.title);
    // date-desc fallback by id/year
    return (b.year||0) - (a.year||0);
  });
  renderBooks();
}

function renderBooks(){
  booksSection.className = 'books ' + viewMode;
  booksSection.innerHTML = '';
  filtered.forEach(b=>{
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img data-src="${b.cover}" alt="Cover of ${b.title}" class="cover" loading="lazy">
      <div class="meta"><strong>${b.title}</strong><span class="muted">${b.year||''}</span></div>
      <div class="muted">${b.author}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="progress" title="Progress">
          <i style="width:${b.progress||0}%"></i>
        </div>
        <div class="card-actions">
          <button class="small-btn open-btn" data-id="${b.id}">Open</button>
          <button class="small-btn finish-btn" data-id="${b.id}">Mark Finished</button>
        </div>
      </div>
    `;
    booksSection.appendChild(card);
    // lazy load
    const img = card.querySelector('img');
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries, obs)=>{
        entries.forEach(en=>{
          if(en.isIntersecting){
            img.src = img.dataset.src;
            obs.disconnect();
          }
        });
      });
      io.observe(img);
    } else {
      img.src = img.dataset.src;
    }
  });

  // wire open / finish
  booksSection.querySelectorAll('.open-btn').forEach(b=>b.addEventListener('click', e=>{
    const id = +e.target.dataset.id;
    openModal(id);
  }));
  booksSection.querySelectorAll('.finish-btn').forEach(b=>b.addEventListener('click', e=>{
    const id = +e.target.dataset.id;
    markFinished(id);
  }));
}

function renderCarousel(){
  const featured = books.slice(0,3);
  carouselTrack.innerHTML = '';
  featured.forEach(b=>{
    const el = document.createElement('div');
    el.className = 'carousel-item';
    el.innerHTML = `<img src="${b.cover}" alt="Cover of ${b.title}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`;
    el.addEventListener('click', ()=>openModal(b.id));
    carouselTrack.appendChild(el);
  });
}

// modal
function openModal(id){
  currentBook = books.find(b=>b.id === id);
  if(!currentBook) return;
  modalCover.src = currentBook.cover;
  modalCover.alt = `Cover of ${currentBook.title}`;
  modalTitle.textContent = currentBook.title;
  modalAuthor.textContent = currentBook.author + (currentBook.year ? ` — ${currentBook.year}` : '');
  modalGenre.textContent = currentBook.genre || '';
  // rating stars
  renderStars(currentBook.rating || 0);
  progressRange.value = currentBook.progress || 0;
  progressVal.textContent = progressRange.value + '%';
  notesArea.value = currentBook.notes || '';
  externalLink.href = currentBook.link || '#';
  modal.setAttribute('aria-hidden','false');
  modal.querySelector('.modal-panel').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  currentBook = null;
}

function renderStars(selected){
  ratingStars.innerHTML = '';
  for(let i=1;i<=5;i++){
    const btn = document.createElement('button');
    btn.innerHTML = i <= selected ? '★' : '☆';
    btn.setAttribute('data-value', i);
    btn.addEventListener('click', ()=> {
      renderStars(i);
      ratingStars.dataset.value = i;
    });
    ratingStars.appendChild(btn);
  }
}

// save modal edits
function onSave(){
  if(!currentBook) return;
  const rating = +ratingStars.dataset.value || 0;
  const progress = +progressRange.value || 0;
  const notes = notesArea.value || '';
  // update in memory and persist per-book
  currentBook.rating = rating;
  currentBook.progress = progress;
  currentBook.notes = notes;
  saveLocal(currentBook.id,{rating,progress,notes});
  // update displayed cards
  applyFilters();
  showToast('Saved');
  closeModal();
}

// mark finished quick action
function markFinished(id){
  const b = books.find(x=>x.id===id);
  if(!b) return;
  b.status = 'Finished';
  b.progress = 100;
  saveLocal(id,{status:'Finished',progress:100,rating:b.rating||5,notes:b.notes||''});
  applyFilters();
  showToast('Marked finished');
}

// search/typeahead (simple)
let typeaheadTimer;
function buildTypeahead(){
  searchInput.addEventListener('input', (e)=>{
    clearTimeout(typeaheadTimer);
    typeaheadTimer = setTimeout(()=>{
      applyFilters();
    }, 180);
  });
}
function onSearch(){ applyFilters(); }

// view & theme
function applyView(){
  viewMode = localStorage.getItem('yr_view') || viewMode;
  viewToggle.textContent = viewMode === 'grid' ? 'Grid' : 'List';
  persistView();
}
function toggleView(){
  viewMode = viewMode === 'grid' ? 'list' : 'grid';
  applyView();
  renderBooks();
}
function toggleTheme(){
  theme = theme === 'light' ? 'dark' : 'light';
  // for simplicity, invert background colors for dark
  if(theme === 'dark'){
    document.documentElement.style.setProperty('--bg','#071029');
    document.documentElement.style
