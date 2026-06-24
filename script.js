/* ============================================================
   TechFix — IT Support Ticket Dashboard
   Author: Hira Hussain Tajlani
   ============================================================ */

// ----- State -----
let tickets = [];
let currentFilter = "all";

// ----- DOM References -----
const ticketForm = document.getElementById("ticketForm");
const ticketGrid = document.getElementById("ticketGrid");
const emptyState = document.getElementById("emptyState");
const filterBtns = document.querySelectorAll(".filter-btn");
const totalEl = document.getElementById("totalTickets");
const pendingEl = document.getElementById("pendingTickets");
const progressEl = document.getElementById("inProgressTickets");
const resolvedEl = document.getElementById("resolvedTickets");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const goToFormBtn = document.getElementById("goToFormBtn");
const currentDateEl = document.getElementById("currentDate");
const navItems = document.querySelectorAll(".nav-item");
const dashboardSection = document.getElementById("dashboardSection");
const ticketsSection = document.getElementById("ticketsSection");

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================

/** Load tickets array from localStorage */
function loadTickets() {
  const stored = localStorage.getItem("techfix_tickets");
  if (stored) {
    try {
      tickets = JSON.parse(stored);
    } catch {
      tickets = [];
    }
  } else {
    tickets = [];
  }
}

/** Save tickets array to localStorage */
function saveTickets() {
  localStorage.setItem("techfix_tickets", JSON.stringify(tickets));
}

/** Load theme preference from localStorage (default: light) */
function loadTheme() {
  const theme = localStorage.getItem("techfix_theme");
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeLabel.textContent = "Light Mode";
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeLabel.textContent = "Dark Mode";
  }
}

/** Save theme preference to localStorage */
function saveTheme(theme) {
  localStorage.setItem("techfix_theme", theme);
}

// ============================================================
// TICKET ID GENERATION
// ============================================================

/** Generate a unique ticket ID like TCK-1001 */
function generateTicketId() {
  if (tickets.length === 0) return "TCK-1001";
  const numbers = tickets.map((t) => {
    const num = parseInt(t.id.replace("TCK-", ""), 10);
    return isNaN(num) ? 1000 : num;
  });
  const max = Math.max(...numbers);
  return "TCK-" + (max + 1);
}

// ============================================================
// DATE FORMATTING
// ============================================================

/** Return a formatted date string */
function formatDate(date) {
  const d = new Date(date);
  const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return d.toLocaleDateString("en-US", options);
}

/** Display today's date in the header */
function displayCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  currentDateEl.textContent = now.toLocaleDateString("en-US", options);
}

// ============================================================
// RENDER TICKETS
// ============================================================

/** Render tickets to the grid based on the current filter */
function renderTickets() {
  // Filter logic
  let filtered = tickets;
  if (currentFilter === "Pending") {
    filtered = tickets.filter((t) => t.status === "Pending");
  } else if (currentFilter === "In Progress") {
    filtered = tickets.filter((t) => t.status === "In Progress");
  } else if (currentFilter === "Resolved") {
    filtered = tickets.filter((t) => t.status === "Resolved");
  } else if (currentFilter === "high") {
    filtered = tickets.filter((t) => t.priority === "High");
  }

  // Clear grid
  ticketGrid.innerHTML = "";

  // Show empty state if no tickets match
  if (tickets.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  // If filter matches nothing, show a message
  if (filtered.length === 0) {
    emptyState.style.display = "block";
    emptyState.querySelector("h3").textContent = "No matching tickets";
    emptyState.querySelector("p").textContent =
      "Try changing the filter to see more results.";
    emptyState.querySelector("button").style.display = "none";
    updateStats();
    return;
  }

  emptyState.style.display = "none";

  // Build cards
  filtered.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = "ticket-card";
    card.dataset.id = ticket.id;

    // Status badge class
    const statusClass =
      ticket.status === "Pending"
        ? "badge-pending"
        : ticket.status === "In Progress"
        ? "badge-in-progress"
        : "badge-resolved";

    // Priority badge class
    const priorityClass =
      ticket.priority === "Low"
        ? "badge-low"
        : ticket.priority === "Medium"
        ? "badge-medium"
        : "badge-high";

    card.innerHTML = `
      <div class="ticket-header">
        <span class="ticket-id">${ticket.id}</span>
        <div class="ticket-badges">
          <span class="badge ${statusClass}">${ticket.status}</span>
          <span class="badge ${priorityClass}">${ticket.priority}</span>
        </div>
      </div>
      <div class="ticket-body">
        <div class="ticket-name">${escapeHtml(ticket.name)}</div>
        <div class="ticket-email">${escapeHtml(ticket.email)}</div>
        <div class="ticket-issue">${escapeHtml(ticket.issueType)}</div>
        <div class="ticket-desc">${escapeHtml(ticket.description)}</div>
      </div>
      <div class="ticket-meta">
        <span class="ticket-date">${formatDate(ticket.date)}</span>
      </div>
      <div class="ticket-actions">
        <select class="status-select" data-id="${ticket.id}">
          <option value="Pending" ${ticket.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="In Progress" ${ticket.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Resolved" ${ticket.status === "Resolved" ? "selected" : ""}>Resolved</option>
        </select>
        <button class="delete-btn" data-id="${ticket.id}" title="Delete ticket">&times;</button>
      </div>
    `;

    ticketGrid.appendChild(card);
  });

  updateStats();
}

/** Basic escape to prevent XSS */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// STATISTICS
// ============================================================

/** Update the stat cards with current counts */
function updateStats() {
  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === "Pending").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;

  totalEl.textContent = total;
  pendingEl.textContent = pending;
  progressEl.textContent = inProgress;
  resolvedEl.textContent = resolved;
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

/** Add a new ticket from form data */
function addTicket(name, email, issueType, priority, description) {
  const ticket = {
    id: generateTicketId(),
    name: name.trim(),
    email: email.trim(),
    issueType,
    priority,
    description: description.trim(),
    date: new Date().toISOString(),
    status: "Pending",
  };
  tickets.unshift(ticket);
  saveTickets();
  renderTickets();
}

/** Delete a ticket by ID */
function deleteTicket(id) {
  tickets = tickets.filter((t) => t.id !== id);
  saveTickets();
  renderTickets();
}

/** Update the status of a ticket */
function updateTicketStatus(id, newStatus) {
  const ticket = tickets.find((t) => t.id === id);
  if (ticket) {
    ticket.status = newStatus;
    saveTickets();
    renderTickets();
  }
}

// ============================================================
// EVENT HANDLERS
// ============================================================

// ----- Form Submit -----
ticketForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const issueType = document.getElementById("issueType").value;
  const priority = document.getElementById("priority").value;
  const description = document.getElementById("description").value;

  if (!name || !email || !issueType || !priority || !description) return;

  addTicket(name, email, issueType, priority, description);
  ticketForm.reset();

  // Switch to tickets view
  setActiveTab("tickets");
});

// ----- Ticket Click Delegation (status change / delete) -----
ticketGrid.addEventListener("change", function (e) {
  if (e.target.classList.contains("status-select")) {
    const id = e.target.dataset.id;
    const newStatus = e.target.value;
    updateTicketStatus(id, newStatus);
  }
});

ticketGrid.addEventListener("click", function (e) {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    if (confirm("Are you sure you want to delete this ticket?")) {
      deleteTicket(id);
    }
  }
});

// ----- Filter Buttons -----
filterBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    filterBtns.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    renderTickets();
  });
});

// ----- Theme Toggle -----
themeToggle.addEventListener("click", function () {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    themeLabel.textContent = "Dark Mode";
    saveTheme("light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    themeLabel.textContent = "Light Mode";
    saveTheme("dark");
  }
});

// ----- Sidebar Navigation -----
navItems.forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    const tab = this.dataset.tab;
    setActiveTab(tab);
    // Close sidebar on mobile
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  });
});

function setActiveTab(tab) {
  navItems.forEach((n) => n.classList.remove("active"));
  const activeNav = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (activeNav) activeNav.classList.add("active");

  if (tab === "dashboard") {
    dashboardSection.style.display = "block";
    ticketsSection.style.display = "none";
    document.querySelector(".page-title").textContent = "IT Support Dashboard";
  } else {
    dashboardSection.style.display = "none";
    ticketsSection.style.display = "block";
    document.querySelector(".page-title").textContent = "All Tickets";
  }
}

// ----- Mobile Sidebar Toggle -----
menuBtn.addEventListener("click", function () {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
});

overlay.addEventListener("click", function () {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
});

// ----- Toggle Form Visibility -----
toggleFormBtn.addEventListener("click", function () {
  const form = document.querySelector(".ticket-form");
  form.classList.toggle("hidden");
  this.textContent = form.classList.contains("hidden") ? "+ Show" : "\u2212 Hide";
});

// ----- Go to Form from Empty State -----
goToFormBtn.addEventListener("click", function () {
  // Show dashboard
  setActiveTab("dashboard");
  // Scroll to form
  document.querySelector(".form-wrapper").scrollIntoView({ behavior: "smooth" });
  // Ensure form is visible
  const form = document.querySelector(".ticket-form");
  if (form.classList.contains("hidden")) {
    form.classList.remove("hidden");
    toggleFormBtn.textContent = "\u2212 Hide";
  }
});

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  loadTheme();
  loadTickets();
  displayCurrentDate();
  renderTickets();
  setActiveTab("dashboard");
}

init();
