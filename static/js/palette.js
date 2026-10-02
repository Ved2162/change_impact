/* ═══════════════════════════════════════════════════════════════════════════
   Change Impact – palette.js
   Port of CommandPalette from Chrome.tsx → plain JS
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const NAV_ITEMS = [
    { id: "home",                 label: "Home",                 group: "Workspace" },
    { id: "analysis",             label: "Project Analysis",     group: "Workspace" },
    { id: "project-insights",     label: "Project Insights",     group: "Workspace" },
    { id: "analyze-change",       label: "Analyze Change",       group: "Change" },
    { id: "what-if",              label: "What-If Simulation",   group: "Change" },
    { id: "impact-graph",         label: "Impact Graph",         group: "Change" },
    { id: "impact-analysis",      label: "Impact Analysis",      group: "Change" },
    { id: "github",               label: "GitHub",               group: "System" },
    { id: "reports",              label: "Reports",              group: "System" },
    { id: "history",              label: "History",              group: "System" },
    { id: "settings",             label: "Settings",             group: "System" },
    { id: "add-project",          label: "Add Project",          group: "Actions" },
    { id: "current-flow",         label: "Current Flow",         group: "Workspace" },
    { id: "dependencies",         label: "Dependencies",         group: "Workspace" },
    { id: "security",             label: "Security",             group: "Workspace" },
    { id: "environment",          label: "Environment",          group: "Workspace" },
    { id: "before-after",         label: "Before vs After",      group: "Change" },
    { id: "change-impact-report", label: "Change Impact Report", group: "Change" },
  ];

  let open  = false;
  let idx   = 0;
  let query = "";
  let filtered = [...NAV_ITEMS];

  /* ── DOM ─────────────────────────────────────────────────────────── */
  const overlay = document.createElement("div");
  overlay.className = "ci-palette-overlay";
  overlay.style.display = "none";
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("role", "dialog");
  overlay.addEventListener("pointerdown", closePalette);

  overlay.innerHTML = `
    <div class="ci-palette" id="ci-palette-panel">
      <div class="ci-palette-input-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2">
          <rect x="3" y="3" width="5" height="5"/><rect x="10" y="3" width="5" height="5"/>
          <rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="5" height="5"/>
        </svg>
        <input id="ci-palette-input" class="ci-palette-input" placeholder="Type a command or search…" autocomplete="off" spellcheck="false">
        <span class="mono" style="font-size:9px;color:var(--text-3);">ESC</span>
      </div>
      <div class="ci-palette-list" id="ci-palette-list"></div>
    </div>`;

  overlay.querySelector("#ci-palette-panel").addEventListener("pointerdown", e => e.stopPropagation());

  document.body.appendChild(overlay);

  /* ── input ──────────────────────────────────────────────────────── */
  const input = overlay.querySelector("#ci-palette-input");
  input.addEventListener("input", () => { query = input.value; idx = 0; renderList(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(filtered.length - 1, idx + 1); renderList(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); idx = Math.max(0, idx - 1); renderList(); }
    if (e.key === "Enter" && filtered[idx]) { navigate(filtered[idx].id); closePalette(); }
    if (e.key === "Escape") closePalette();
  });

  /* ── list ───────────────────────────────────────────────────────── */
  function renderList() {
    const q = query.toLowerCase();
    filtered = q ? NAV_ITEMS.filter(a => a.label.toLowerCase().includes(q)) : [...NAV_ITEMS];
    const list = overlay.querySelector("#ci-palette-list");
    if (!filtered.length) {
      list.innerHTML = `<div class="ci-palette-empty">No matching commands.</div>`;
      return;
    }
    list.innerHTML = filtered.map((a, i) => `
      <button class="ci-palette-item${i === idx ? " active" : ""}" data-idx="${i}" data-id="${a.id}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${i===idx?"var(--blue)":"var(--text-3)"}" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span class="ci-palette-item-label">${a.label}</span>
        <span class="ci-palette-item-group">${a.group}</span>
      </button>`).join("");

    list.querySelectorAll(".ci-palette-item").forEach(btn => {
      btn.addEventListener("mouseenter", () => { idx = Number(btn.dataset.idx); renderList(); });
      btn.addEventListener("click", () => { navigate(btn.dataset.id); closePalette(); });
    });

    // scroll active item into view
    const activeBtn = list.querySelector(".active");
    if (activeBtn) activeBtn.scrollIntoView({ block: "nearest" });
  }

  /* ── open / close ───────────────────────────────────────────────── */
  function openPalette() {
    open = true; query = ""; idx = 0; filtered = [...NAV_ITEMS];
    overlay.style.display = "flex";
    input.value = "";
    renderList();
    requestAnimationFrame(() => input.focus());
  }

  function closePalette() {
    open = false;
    overlay.style.display = "none";
  }

  function navigate(id) {
    window.location.href = `/${id}/`;
  }

  /* ── keyboard shortcut ─────────────────────────────────────────── */
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (open) closePalette(); else openPalette();
    }
    if (e.key === "Escape" && open) closePalette();
  });

  /* ── search button in topbar ───────────────────────────────────── */
  const searchBtn = document.getElementById("ci-topbar-search-btn");
  if (searchBtn) searchBtn.addEventListener("click", openPalette);

  window.CI_openPalette = openPalette;
})();
