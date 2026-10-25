const STORAGE_KEY = "readingListBooks";
const MAX_TITLE_LENGTH = 60;

const form = document.getElementById("bookForm");
const titleInput = document.getElementById("titleInput");
const statusSelect = document.getElementById("statusSelect");
const messageEl = document.getElementById("message");
const bookListEl = document.getElementById("bookList");
const filtersEl = document.getElementById("filters");

const totalCountEl = document.getElementById("totalCount");
const readingCountEl = document.getElementById("readingCount");
const finishedCountEl = document.getElementById("finishedCount");

const STATUSES = ["Want to Read", "Reading", "Finished"];

let books = loadBooks();
let currentFilter = "All";

/* ---------- storage (browser only) ---------- */
function loadBooks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveBooks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
        /* storage unavailable: the app still works for this visit */
    }
}

/* ---------- helpers ---------- */
function cleanTitle(text) {
    return text.trim().replace(/\s+/g, " ");
}

function showMessage(text) {
    messageEl.textContent = text;
}

function badgeClass(status) {
    if (status === "Reading") return "reading";
    if (status === "Finished") return "finished";
    return "want";
}

/* ---------- rendering ---------- */
function updateSummary() {
    totalCountEl.textContent = books.length;
    readingCountEl.textContent = books.filter(function (b) { return b.status === "Reading"; }).length;
    finishedCountEl.textContent = books.filter(function (b) { return b.status === "Finished"; }).length;
}

function createBookCard(book) {
    const card = document.createElement("article");
    card.className = "book-card";

    const title = document.createElement("span");
    title.className = "book-title";
    title.textContent = book.title;

    const actions = document.createElement("div");
    actions.className = "book-actions";

    const badge = document.createElement("span");
    badge.className = "badge " + badgeClass(book.status);
    badge.textContent = book.status;

    const select = document.createElement("select");
    select.setAttribute("aria-label", "Change status of " + book.title);
    STATUSES.forEach(function (status) {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        if (status === book.status) option.selected = true;
        select.appendChild(option);
    });
    select.addEventListener("change", function () {
        changeStatus(book.id, select.value);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
        deleteBook(book.id);
    });

    actions.append(badge, select, deleteButton);
    card.append(title, actions);
    return card;
}

function render() {
    updateSummary();
    bookListEl.replaceChildren();

    if (books.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "Your reading list is empty. Add your first book.";
        bookListEl.appendChild(empty);
        return;
    }

    const visible = books.filter(function (b) {
        return currentFilter === "All" || b.status === currentFilter;
    });

    if (visible.length === 0) {
        const none = document.createElement("p");
        none.className = "empty";
        none.textContent = "No books with this status yet.";
        bookListEl.appendChild(none);
        return;
    }

    visible.forEach(function (book) {
        bookListEl.appendChild(createBookCard(book));
    });
}

/* ---------- actions ---------- */
function addBook(event) {
    event.preventDefault();
    const title = cleanTitle(titleInput.value);

    if (!title) {
        showMessage("Please enter a book title.");
        return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
        showMessage("Book title must be 60 characters or fewer.");
        return;
    }
    const duplicate = books.some(function (b) {
        return b.title.toLowerCase() === title.toLowerCase();
    });
    if (duplicate) {
        showMessage("This book is already in your reading list.");
        return;
    }

    books.push({
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        title: title,
        status: statusSelect.value
    });
    saveBooks();
    showMessage("");
    titleInput.value = "";
    titleInput.focus();
    render();
}

function changeStatus(id, newStatus) {
    const book = books.find(function (b) { return b.id === id; });
    if (!book) return;
    book.status = newStatus;
    saveBooks();
    render();
}

function deleteBook(id) {
    books = books.filter(function (b) { return b.id !== id; });
    saveBooks();
    render();
}

function setFilter(event) {
    const button = event.target.closest(".filter");
    if (!button) return;
    currentFilter = button.dataset.filter;
    filtersEl.querySelectorAll(".filter").forEach(function (f) {
        f.classList.toggle("active", f === button);
    });
    render();
}

form.addEventListener("submit", addBook);
filtersEl.addEventListener("click", setFilter);
titleInput.addEventListener("input", function () { showMessage(""); });

render();
