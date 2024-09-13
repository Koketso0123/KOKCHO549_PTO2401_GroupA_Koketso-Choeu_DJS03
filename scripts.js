//LINK FOR PRESENTATION IN README
import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

let page = 1;
let matches = books;

const starting = document.createDocumentFragment();

for (const { author, id, image, title } of matches.slice(0, BOOKS_PER_PAGE)) {
  const element = document.createElement("button");
  element.classList = "preview";
  element.setAttribute("data-preview", id);

  element.innerHTML = `
        <img
            class="preview__image"
            src="${image}"
        />

        <div class="preview__info">
            <h3 class="preview__title">${title}</h3>
            <div class="preview__author">${authors[author]}</div>
        </div>
    `;

  starting.appendChild(element);
}

document.querySelector("[data-list-items]").appendChild(starting);

const genreHtml = document.createDocumentFragment();
const firstGenreElement = document.createElement("option");
firstGenreElement.value = "any";
firstGenreElement.innerText = "All Genres";
genreHtml.appendChild(firstGenreElement);

for (const [id, name] of Object.entries(genres)) {
  const element = document.createElement("option");
  element.value = id;
  element.innerText = name;
  genreHtml.appendChild(element);
}

document.querySelector("[data-search-genres]").appendChild(genreHtml);

const authorsHtml = document.createDocumentFragment();
const firstAuthorElement = document.createElement("option");
firstAuthorElement.value = "any";
firstAuthorElement.innerText = "All Authors";
authorsHtml.appendChild(firstAuthorElement);

for (const [id, name] of Object.entries(authors)) {
  const element = document.createElement("option");
  element.value = id;
  element.innerText = name;
  authorsHtml.appendChild(element);
}

document.querySelector("[data-search-authors]").appendChild(authorsHtml);

class BookList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Get the template from the HTML
    const template = document.getElementById("book-list-template");
    const templateContent = template.content.cloneNode(true);

    this.shadowRoot.appendChild(templateContent);
  }

  connectedCallback() {
    // CHANGES THEMES FROM LIGHT TO DARK
    function applyTheme(theme, darkColor, lightColor) {
      document.querySelector("[data-settings-theme]").value = theme;
      document.documentElement.style.setProperty("--color-dark", darkColor);
      document.documentElement.style.setProperty("--color-light", lightColor);
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      applyTheme("night", "255, 255, 255", "10, 10, 20");
    } else {
      applyTheme("day", "10, 10, 20", "255, 255, 255");
    }
  }
}

customElements.define("book-list", BookList);

function updateButtonState(buttonElement, remainingBooks, booksPerPage) {
  const remaining = remainingBooks > 0 ? remainingBooks : 0;
  buttonElement.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remaining})</span>
    `;
  buttonElement.disabled = remaining <= 0;
}

const remainingBooks = matches.length - page * BOOKS_PER_PAGE;
const listButton = document.querySelector("[data-list-button]");
updateButtonState(listButton, remainingBooks, BOOKS_PER_PAGE);

class togglingOverlay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Get the template from the HTML
    const toggling = document.getElementById("overlay-buttons");
    const toggleTemplateContent = template.content.cloneNode(true);

    this.shadowRoot.appendChild(toggleTemplateContent);
  }

  connectedCallback() {
    // a function to handle adding event listeners and toggling the open state of overlays.
    function toggleOverlay(
      triggerSelector,
      overlaySelector,
      openState,
      focusSelector = null
    ) {
      document.querySelector(triggerSelector).addEventListener("click", () => {
        document.querySelector(overlaySelector).open = openState;
        if (focusSelector) {
          document.querySelector(focusSelector).focus();
        }
      });
    }

    // Cancel buttons to close overlays
    toggleOverlay("[data-search-cancel]", "[data-search-overlay]", false);
    toggleOverlay("[data-settings-cancel]", "[data-settings-overlay]", false);
    toggleOverlay("[data-list-close]", "[data-list-active]", false);

    // Header buttons to open overlays
    toggleOverlay(
      "[data-header-search]",
      "[data-search-overlay]",
      true,
      "[data-search-title]"
    );
    toggleOverlay("[data-header-settings]", "[data-settings-overlay]", true);
  }
}

customElements.define("overlay-buttons", togglingOverlay);

document
  .querySelector("[data-settings-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);

    if (theme === "night") {
      document.documentElement.style.setProperty(
        "--color-dark",
        "255, 255, 255"
      );
      document.documentElement.style.setProperty("--color-light", "10, 10, 20");
    } else {
      document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
      document.documentElement.style.setProperty(
        "--color-light",
        "255, 255, 255"
      );
    }

    document.querySelector("[data-settings-overlay]").open = false;
  });

// SECTION THAT CONTROLS THE FILTERING OF THE BOOKS
document
  .querySelector("[data-search-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    const result = [];

    for (const book of books) {
      let genreMatch = filters.genre === "any";

      for (const singleGenre of book.genres) {
        if (genreMatch) break;
        if (singleGenre === filters.genre) {
          genreMatch = true;
        }
      }

      if (
        (filters.title.trim() === "" ||
          book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
        (filters.author === "any" || book.author === filters.author) &&
        genreMatch
      ) {
        result.push(book);
      }
    }

    page = 1;
    matches = result;

    if (result.length < 1) {
      document
        .querySelector("[data-list-message]")
        .classList.add("list__message_show");
    } else {
      document
        .querySelector("[data-list-message]")
        .classList.remove("list__message_show");
    }

    document.querySelector("[data-list-items]").innerHTML = "";
    const newItems = document.createDocumentFragment();

    for (const { author, id, image, title } of result.slice(
      0,
      BOOKS_PER_PAGE
    )) {
      const element = document.createElement("button");
      element.classList = "preview";
      element.setAttribute("data-preview", id);

      element.innerHTML = `
                <img
                    class="preview__image"
                    src="${image}"
                />

                <div class="preview__info">
                    <h3 class="preview__title">${title}</h3>
                    <div class="preview__author">${authors[author]}</div>
                </div>
            `;

      newItems.appendChild(element);
    }

    document.querySelector("[data-list-items]").appendChild(newItems);
    document.querySelector("[data-list-button]").disabled =
      matches.length - page * BOOKS_PER_PAGE < 1;

    document.querySelector("[data-list-button]").innerHTML = `
            <span>Show more</span>
            <span class="list__remaining"> (${
              matches.length - page * BOOKS_PER_PAGE > 0
                ? matches.length - page * BOOKS_PER_PAGE
                : 0
            })</span>
        `;

    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("[data-search-overlay]").open = false;
  });

// USED TO GENERATE BOOK ELEMENTS
function createBookElement({ author, id, image, title }) {
  const element = document.createElement("button");
  element.classList = "preview";
  element.setAttribute("data-preview", id);

  element.innerHTML = `
        <img class="preview__image" src="${image}" />
        <div class="preview__info">
            <h3 class="preview__title">${title}</h3>
            <div class="preview__author">${authors[author]}</div>
        </div>
    `;

  return element;
}

function appendBooksToList(books, containerSelector) {
  const fragment = document.createDocumentFragment();

  books.forEach((book) => {
    const element = createBookElement(book);
    fragment.appendChild(element);
  });

  document.querySelector(containerSelector).appendChild(fragment);
}

function loadMoreBooks() {
  const start = page * BOOKS_PER_PAGE;
  const end = (page + 1) * BOOKS_PER_PAGE;
  const newBooks = matches.slice(start, end);

  appendBooksToList(newBooks, "[data-list-items]");
  page += 1;
}

document
  .querySelector("[data-list-button]")
  .addEventListener("click", loadMoreBooks);

class BookUpdate extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Get the template from the HTML
    const dialoge = document.getElementsByClassName("overlay");
    const dialogeContent = dialoge.content.cloneNode(true);

    this.shadowRoot.appendChild(dialogeContent);
  }

  connectedCallback() {
    //UPDATES BOOK ELEMENTS IF CLICKED
    function findActiveBook(event, books) {
      const pathArray = Array.from(event.path || event.composedPath());
      for (const node of pathArray) {
        if (node?.dataset?.preview) {
          return books.find((book) => book.id === node.dataset.preview) || null;
        }
      }
      return null;
    }

    function updateBookDetails(activeBook) {
      document.querySelector("[data-list-active]").open = true;
      document.querySelector("[data-list-blur]").src = activeBook.image;
      document.querySelector("[data-list-image]").src = activeBook.image;
      document.querySelector("[data-list-title]").innerText = activeBook.title;
      document.querySelector("[data-list-subtitle]").innerText = `${
        authors[activeBook.author]
      } (${new Date(activeBook.published).getFullYear()})`;
      document.querySelector("[data-list-description]").innerText =
        activeBook.description;
    }

    document
      .querySelector("[data-list-items]")
      .addEventListener("click", (event) => {
        const activeBook = findActiveBook(event, books);
        if (activeBook) {
          updateBookDetails(activeBook);
        }
      });
  }
}

customElements.define("overlay", BookUpdate);
