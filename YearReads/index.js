const BOOKS_URL = "books.json";
const THEME_KEY = "yr_theme";
const VIEW_KEY = "yr_view";

const state = {
  books: [],
  filtered: [],
  currentBookId: null,
  view: localStorage.getItem(VIEW_KEY) || "grid",
  activeStatus: "",
  lastFocusedElement: null
};

const booksSection = document.getElementById("booksSection");
const featuredGrid = document.getElementById("featuredGrid");
const recentGrid = document.getElementById("recentGrid");
const notesList = document.getElementById("notesList");
const resultsCount = document.getElementById("resultsCount");
const genreFilter = document.getElementById("genreFilter");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const titleSuggestions = document.getElementById("titleSuggestions");
const viewToggle = document.getElementById("viewToggle");
const statusBtns = Array.from(document.querySelectorAll(".statusBtns button"));
const carouselTrack = document.getElementById("carouselTrack");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const browseBtn = document.getElementById("browseBtn");
const quickAddBtn = document.getElementById("quickAddBtn");
const addBookBtn = document.getElementById("addBookBtn");
const themeToggle = document.getElementById("themeToggle");
const toastEl = document.getElementById("toast");

const modal = document.getElementById("detailModal");
const modalPanel = modal.querySelector(".modal-panel");
const modalBackdrop = modal.querySelector(".modal-backdrop");
const modalClose = document.getElementById("modalClose");
const modalCover = document.getElementById("modalCover");
const modalTitle = document.getElementById("modalTitle");
const modalAuthor = document.getElementById("modalAuthor");
const modalGenre = document.getElementById("modalGenre");
const ratingStars = document.getElementById("ratingStars");
const progressRange = document.getElementById("progressRange");
const progressVal = document.getElementById("progressVal");
const notesArea = document.getElementById("notesArea");
const externalLink = document.getElementById("externalLink");
const saveBtn = document.getElementById("saveBtn");
const markFinishedBtn = document.getElementById("markFinishedBtn");

function showToast(message, ms = 2000) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), ms);
}

function getBookStorageKey(id) {
  return `yr_book_${id}`;
}

function loadBookLocalState(id) {
  const raw = localStorage.getItem(getBookStorageKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveBookLocalState(book) {
  const data = {
    rating: book.rating,
    notes: book.notes,
    progress: book.progress,
    status: book.status
  };
  localStorage.setItem(getBookStorageKey(book.id), JSON.stringify(data));
}

function resolveInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  themeToggle.textContent = isDark ? "Sun" : "Moon";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function getFallbackBooks() {
  return [
    {
      id: 1,
      title: "The Night Watchman",
      author: "Louise Erdrich",
      year: 2026,
      genre: "Historical Fiction",
      rating: 5,
      status: "Finished",
      progress: 100,
      cover: "images/nightwatchman.svg",
      notes: "Powerful ending; loved the character arcs.",
      summary: "A moving historical novel centered on family, resilience, and justice.",
      link: "https://openlibrary.org"
    },
    {
      id: 2,
      title: "Project Hail Mary",
      author: "Andy Weir",
      year: 2026,
      genre: "Science Fiction",
      rating: 4,
      status: "Reading",
      progress: 45,
      cover: "images/hailmary.svg",
      notes: "Great pacing; science feels plausible.",
      summary: "A high-stakes, science-heavy survival mission in deep space.",
      link: "https://openlibrary.org"
    },
    {
      id: 3,
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      year: 2026,
      genre: "Speculative",
      rating: 4,
      status: "To Read",
      progress: 0,
      cover: "images/klara.svg",
      notes: "",
      summary: "A thoughtful exploration of companionship, memory, and what it means to care.",
      link: "https://openlibrary.org"
    },
    {
      id: 4,
      title: "Educated",
      author: "Tara Westover",
      year: 2025,
      genre: "Memoir",
      rating: 5,
      status: "Finished",
      progress: 100,
      cover: "images/hailmary.svg",
      notes: "Raw and unforgettable voice.",
      summary: "A memoir about education, identity, and personal transformation.",
      link: "https://openlibrary.org"
    },
    {
      id: 5,
      title: "The Left Hand of Darkness",
      author: "Ursula K. Le Guin",
      year: 2024,
      genre: "Science Fiction",
      rating: 5,
      status: "Finished",
      progress: 100,
      cover: "images/klara.svg",
      notes: "Excellent world-building and themes.",
      summary: "A classic novel of politics, culture, and identity on a distant world.",
      link: "https://openlibrary.org"
    },
    {
      id: 6,
      title: "The Poisonwood Bible",
      author: "Barbara Kingsolver",
      year: 2024,
      genre: "Literary Fiction",
      rating: 4,
      status: "Reading",
      progress: 62,
      cover: "images/nightwatchman.svg",
      notes: "Every character voice feels distinct.",
      summary: "A family saga told through multiple perspectives and years of change.",
      link: "https://openlibrary.org"
    }
  ];
}

async function loadBooks() {
  try {
    const response = await fetch(BOOKS_URL);
    if (!response.ok) throw new Error("books.json missing");
    state.books = await response.json();
  } catch {
    state.books = getFallbackBooks();
  }

  state.books = state.books.map((book) => {
    const local = loadBookLocalState(book.id);
    return local ? { ...book, ...local } : book;
  });

  initializeUI();
}

function initializeUI() {
  applyTheme(resolveInitialTheme());
  populateGenres();
  buildTypeahead();
  applyViewState();
  renderHomeSections();
  applyFilters();
  wireEvents();
}

function wireEvents() {
  themeToggle.addEventListener("click", toggleTheme);
  searchInput.addEventListener("input", debounce(applyFilters, 160));
  genreFilter.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
  viewToggle.addEventListener("click", toggleView);
  clearFiltersBtn.addEventListener("click", clearFilters);

  statusBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      statusBtns.forEach((other) => other.classList.remove("active"));
      btn.classList.add("active");
      state.activeStatus = btn.dataset.status || "";
      applyFilters();
    });
  });

  browseBtn.addEventListener("click", () => {
    document.getElementById("allBooks").scrollIntoView({ behavior: "smooth" });
  });

  quickAddBtn.addEventListener("click", () => showToast("Add Book form can be connected next."));
  addBookBtn.addEventListener("click", () => showToast("Add Book form can be connected next."));

  modalBackdrop.addEventListener("click", closeModal);
  modalClose.addEventListener("click", closeModal);
  progressRange.addEventListener("input", () => {
    progressVal.textContent = `${progressRange.value}%`;
  });
  saveBtn.addEventListener("click", saveModalEdits);
  markFinishedBtn.addEventListener("click", () => {
    const book = getCurrentBook();
    if (!book) return;
    book.status = "Finished";
    book.progress = 100;
    progressRange.value = "100";
    progressVal.textContent = "100%";
    saveModalEdits();
  });

  document.addEventListener("keydown", onKeydown);
}

function debounce(fn, delay) {
  let timerId = null;
  return function debounced() {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(fn, delay);
  };
}

function populateGenres() {
  const genres = Array.from(new Set(state.books.map((book) => book.genre))).sort();
  genreFilter.innerHTML = '<option value="">All genres</option>';
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

function buildTypeahead() {
  titleSuggestions.innerHTML = "";
  const suggestions = Array.from(
    new Set(state.books.flatMap((book) => [book.title, book.author]))
  );
  suggestions.sort().forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    titleSuggestions.appendChild(option);
  });
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedGenre = genreFilter.value;
  const status = state.activeStatus;

  state.filtered = state.books.filter((book) => {
    if (selectedGenre && book.genre !== selectedGenre) return false;
    if (status && book.status !== status) return false;
    if (!query) return true;
    const haystack = `${book.title} ${book.author} ${book.notes} ${book.genre}`.toLowerCase();
    return haystack.includes(query);
  });

  const sortBy = sortSelect.value;
  state.filtered.sort((a, b) => {
    if (sortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "title-asc") return a.title.localeCompare(b.title);
    return (b.year || 0) - (a.year || 0);
  });

  renderBooks();
}

function applyViewState() {
  localStorage.setItem(VIEW_KEY, state.view);
  viewToggle.textContent = state.view === "grid" ? "Grid View" : "List View";
  booksSection.className = `books ${state.view}`;
}

function toggleView() {
  state.view = state.view === "grid" ? "list" : "grid";
  applyViewState();
  renderBooks();
}

function clearFilters() {
  searchInput.value = "";
  genreFilter.value = "";
  sortSelect.value = "date-desc";
  state.activeStatus = "";
  statusBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.status === "");
  });
  applyFilters();
}

function renderHomeSections() {
  const featured = [...state.books]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);
  const recent = [...state.books].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 6);

  renderMiniCards(featuredGrid, featured, true);
  renderMiniCards(recentGrid, recent, false);
  renderCarousel(featured.slice(0, 3));
  renderNotesPreview();
}

function renderMiniCards(target, list, useNotes) {
  target.innerHTML = "";
  list.forEach((book) => {
    const card = document.createElement("article");
    card.className = "mini-card";
    card.innerHTML = `
      <img src="${book.cover}" alt="Cover of ${book.title}" loading="lazy">
      <div class="mini-content">
        <h3>${escapeHTML(book.title)}</h3>
        <p>${escapeHTML(book.author)}</p>
        ${useNotes ? `<p>${escapeHTML((book.notes || "No notes yet.").slice(0, 80))}</p>` : ""}
      </div>
    `;
    card.addEventListener("click", () => openModal(book.id));
    target.appendChild(card);
  });
}

function renderCarousel(list) {
  carouselTrack.innerHTML = "";
  list.forEach((book) => {
    const button = document.createElement("button");
    button.className = "carousel-item";
    button.setAttribute("aria-label", `Open ${book.title}`);
    button.innerHTML = `<img src="${book.cover}" alt="Cover of ${book.title}" loading="lazy">`;
    button.addEventListener("click", () => openModal(book.id));
    carouselTrack.appendChild(button);
  });
}

function renderNotesPreview() {
  const withNotes = state.books.filter((book) => (book.notes || "").trim()).slice(0, 5);
  notesList.innerHTML = "";
  if (withNotes.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No notes saved yet.";
    notesList.appendChild(empty);
    return;
  }
  withNotes.forEach((book) => {
    const item = document.createElement("li");
    item.textContent = `${book.title}: ${(book.notes || "").slice(0, 110)}`;
    notesList.appendChild(item);
  });
}

function renderBooks() {
  applyViewState();
  booksSection.innerHTML = "";
  resultsCount.textContent = `${state.filtered.length} result${state.filtered.length === 1 ? "" : "s"}`;

  if (state.filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No books match your current filters.";
    booksSection.appendChild(empty);
    return;
  }

  state.filtered.forEach((book) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img class="cover" data-src="${book.cover}" alt="Cover of ${book.title}" loading="lazy">
      <div class="card-content">
        <div class="meta">
          <strong>${escapeHTML(book.title)}</strong>
          <span class="muted">${book.year || ""}</span>
        </div>
        <span class="muted">${escapeHTML(book.author)}</span>
        <div class="chips">
          <span class="chip">${escapeHTML(book.genre || "General")}</span>
          <span class="chip">${escapeHTML(book.status || "To Read")}</span>
          <span class="chip">${"*".repeat(Math.max(0, book.rating || 0))}</span>
        </div>
        <div class="progress" aria-label="Progress ${book.progress || 0} percent">
          <i style="width:${book.progress || 0}%"></i>
        </div>
        <div class="card-actions">
          <button type="button" data-action="open" data-id="${book.id}">Open Detail</button>
          <button type="button" data-action="finish" data-id="${book.id}">Mark Finished</button>
        </div>
      </div>
    `;
    booksSection.appendChild(card);
    lazyLoadCardCover(card.querySelector("img"));
  });

  booksSection.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = Number(event.currentTarget.dataset.id);
      const action = event.currentTarget.dataset.action;
      if (action === "open") openModal(id);
      if (action === "finish") markBookFinished(id);
    });
  });
}

function lazyLoadCardCover(img) {
  if (!("IntersectionObserver" in window)) {
    img.src = img.dataset.src;
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      img.src = img.dataset.src;
      obs.unobserve(img);
    });
  });
  observer.observe(img);
}

function markBookFinished(id) {
  const book = state.books.find((candidate) => candidate.id === id);
  if (!book) return;
  book.status = "Finished";
  book.progress = 100;
  if (!book.rating) book.rating = 5;
  saveBookLocalState(book);
  applyFilters();
  renderHomeSections();
  showToast("Marked as finished");
}

function openModal(id) {
  const book = state.books.find((candidate) => candidate.id === id);
  if (!book) return;

  state.currentBookId = id;
  state.lastFocusedElement = document.activeElement;

  modalCover.src = book.cover;
  modalCover.alt = `Cover of ${book.title}`;
  modalTitle.textContent = book.title;
  modalAuthor.textContent = `${book.author} - ${book.year || ""}`;
  modalGenre.textContent = `${book.genre || "General"} - ${book.status || "To Read"}`;
  progressRange.value = String(book.progress || 0);
  progressVal.textContent = `${book.progress || 0}%`;
  notesArea.value = book.notes || "";
  externalLink.href = book.link || "https://openlibrary.org";
  externalLink.textContent = "Buy or Borrow";
  renderStars(book.rating || 0);

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modalPanel.focus();
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  state.currentBookId = null;
  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
    state.lastFocusedElement.focus();
  }
}

function renderStars(selected) {
  ratingStars.dataset.value = String(selected);
  ratingStars.innerHTML = "";

  for (let value = 1; value <= 5; value += 1) {
    const star = document.createElement("button");
    star.type = "button";
    star.textContent = value <= selected ? "★" : "☆";
    star.className = value <= selected ? "active" : "";
    star.setAttribute("aria-label", `${value} star`);
    star.setAttribute("aria-checked", String(value === selected));
    star.setAttribute("role", "radio");
    star.addEventListener("click", () => renderStars(value));
    ratingStars.appendChild(star);
  }
}

function getCurrentBook() {
  return state.books.find((book) => book.id === state.currentBookId) || null;
}

function saveModalEdits() {
  const book = getCurrentBook();
  if (!book) return;

  const nextRating = Number(ratingStars.dataset.value || 0);
  const nextProgress = Number(progressRange.value || 0);
  const nextNotes = notesArea.value.trim();

  book.rating = nextRating;
  book.progress = nextProgress;
  book.notes = nextNotes;
  if (nextProgress >= 100) book.status = "Finished";
  else if (nextProgress > 0) book.status = "Reading";
  else book.status = "To Read";

  saveBookLocalState(book);
  renderHomeSections();
  applyFilters();
  showToast("Saved changes");
  closeModal();
}

function onKeydown(event) {
  if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
    closeModal();
  }
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

loadBooks();
