/* ═══════════════════════════════════════════════════════════════════════════
   Change Impact – app.js
   Core app interactions: sidebar collapse, theme toggle, analysis progress,
   all view-specific interactive behaviors (tabs, toggles, accordions, etc.)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── theme ──────────────────────────────────────────────────────── */
  const savedTheme = localStorage.getItem("ci-theme") || "dark";
  document.documentElement.dataset.theme = savedTheme;

  function toggleTheme() {
    const cur = document.documentElement.dataset.theme;
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ci-theme", next);
    // update all theme-toggle buttons' icons
    document.querySelectorAll(".ci-theme-toggle-btn").forEach(btn => {
      btn.innerHTML = next === "dark" ? sunIcon() : moonIcon();
    });
  }

  document.querySelectorAll(".ci-theme-toggle-btn").forEach(btn => {
    btn.innerHTML = savedTheme === "dark" ? sunIcon() : moonIcon();
    btn.addEventListener("click", toggleTheme);
  });

  /* ── sidebar collapse ───────────────────────────────────────────── */
  const sidebar = document.getElementById("ci-sidebar");
  const collapseBtn = document.getElementById("ci-sidebar-collapse");
  const openBtnFooter = document.getElementById("ci-sidebar-open-footer");
  const topbarToggle = document.getElementById("ci-topbar-toggle");
  const sidebarBackdrop = document.getElementById("ci-sidebar-backdrop");

  const MOBILE_BREAKPOINT = 1024;
  function isMobile() { return window.innerWidth < MOBILE_BREAKPOINT; }

  function setSidebarCollapsed(collapsed) {
    if (!sidebar) return;
    if (isMobile()) {
      // mobile mode: use overlay class, don't respect collapsed (keep full width sidebar)
      sidebar.classList.toggle("mobile-open", !collapsed);
      sidebarBackdrop?.classList.toggle("show", !collapsed);
      // keep collapsed in sync so if user resizes to desktop, state is correct
      if (collapsed) {
        sidebar.classList.add("collapsed");
        localStorage.setItem("ci-sidebar-collapsed", "1");
      } else {
        sidebar.classList.remove("collapsed");
        localStorage.setItem("ci-sidebar-collapsed", "0");
      }
    } else {
      // desktop: normal width collapse
      sidebar.classList.remove("mobile-open");
      sidebarBackdrop?.classList.remove("show");
      if (collapsed) {
        sidebar.classList.add("collapsed");
        localStorage.setItem("ci-sidebar-collapsed", "1");
      } else {
        sidebar.classList.remove("collapsed");
        localStorage.setItem("ci-sidebar-collapsed", "0");
      }
    }
    // Update topbar toggle icon
    if (topbarToggle) topbarToggle.innerHTML = collapsed ? panelOpenIcon() : panelCloseIcon();
  }

  // Restore saved state
  const sidebarSaved = localStorage.getItem("ci-sidebar-collapsed");
  if (sidebarSaved === "1") {
    sidebar?.classList.add("collapsed");
    if (sidebar && isMobile()) {
      sidebar.classList.remove("mobile-open");
      sidebarBackdrop?.classList.remove("show");
    }
  } else if (sidebar && isMobile()) {
    // On initial page load at mobile widths, keep sidebar hidden (overlay off) regardless of saved preference
    sidebar.classList.add("collapsed");
    sidebar.classList.remove("mobile-open");
    sidebarBackdrop?.classList.remove("show");
  }

  if (collapseBtn) collapseBtn.addEventListener("click", () => setSidebarCollapsed(true));
  if (openBtnFooter) openBtnFooter.addEventListener("click", () => setSidebarCollapsed(false));
  if (topbarToggle) {
    topbarToggle.innerHTML = (sidebar?.classList.contains("collapsed")) ? panelOpenIcon() : panelCloseIcon();
    topbarToggle.addEventListener("click", () => setSidebarCollapsed(!sidebar?.classList.contains("collapsed")));
  }
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", () => setSidebarCollapsed(true));

  // Re-apply sidebar state when viewport crosses mobile/desktop boundary
  window.addEventListener("resize", () => {
    if (!sidebar) return;
    const saved = localStorage.getItem("ci-sidebar-collapsed") === "1";
    if (isMobile()) {
      sidebar.classList.remove("mobile-open");
      sidebarBackdrop?.classList.remove("show");
      sidebar.classList.add("collapsed");
    } else {
      sidebar.classList.toggle("collapsed", saved);
      sidebar.classList.remove("mobile-open");
      sidebarBackdrop?.classList.remove("show");
      if (topbarToggle) topbarToggle.innerHTML = saved ? panelOpenIcon() : panelCloseIcon();
    }
  });

  /* ── active nav item highlight ──────────────────────────────────── */
  const currentView = document.body.dataset.view;
  if (currentView) {
    document.querySelectorAll(".ci-nav-item[data-view]").forEach(el => {
      if (el.dataset.view === currentView) el.classList.add("active");
    });
  }

  /* ── project analysis progress animation ────────────────────────── */
  const progressBar  = document.getElementById("ci-progress-bar");
  const progressText = document.getElementById("ci-progress-text");
  const progressPct  = document.getElementById("ci-progress-pct");
  const analysisDone = document.getElementById("ci-analysis-done");
  const analysisRunning = document.getElementById("ci-analysis-running");

  if (progressBar) {
    const STEPS = [
      { label: "Scanning files",             result: "126 files · Python 3.12 · Flask detected" },
      { label: "Analyzing functions",        result: "341 functions · 58 classes" },
      { label: "Mapping APIs",               result: "42 endpoints · 9 blueprints" },
      { label: "Analyzing dependencies",     result: "34 packages · 3 advisories" },
      { label: "Checking environment variables", result: "11 variables · 1 missing optional" },
      { label: "Running security analysis",  result: "15 findings · 2 high severity" },
      { label: "Building project relationships", result: "518 edges resolved" },
      { label: "Generating current flow",    result: "architecture map ready" },
    ];
    const LOG_LINES = [
      ["> change-impact analyze ./ecommerce-backend", "var(--text-3)"],
      ["  resolved project root · git HEAD 8f42ac1 · branch main", "var(--text-3)"],
      ["  parsing src/** … 126 files (18,204 LOC)", "var(--text-2)"],
      ["  extracting symbols … 341 functions, 58 classes", "var(--text-2)"],
      ["  tracing routes … 42 endpoints across 9 blueprints", "var(--text-2)"],
      ["  resolving requirements.txt … 34 dependencies", "var(--text-2)"],
      ["  ! pillow 9.5.0 — CVE-2023-50447 (high)", "var(--amber)"],
      ["  reading env config … 11 variables (values masked)", "var(--text-2)"],
      ["  security pass … 15 findings (2 high / 5 medium / 8 low)", "var(--red)"],
      ["  building relationship graph … 518 edges", "var(--text-2)"],
      ["  ✓ current flow generated in 2.41s", "var(--green)"],
    ];

    let stepIdx  = 0;
    let logIdx   = 0;
    let progress = 0;
    const logEl  = document.getElementById("ci-analysis-log");
    const stepEls = document.querySelectorAll(".ci-analysis-step");

    function updateStep() {
      if (stepIdx >= STEPS.length) {
        // done
        if (analysisDone)   analysisDone.style.display = "";
        if (analysisRunning) analysisRunning.style.display = "none";
        if (progressText) progressText.textContent = "Analysis complete";
        setProgress(100, "var(--green)");
        setTimeout(() => { window.location.href = "/overview/"; }, 700);
        return;
      }
      const s = STEPS[stepIdx];
      if (progressText) progressText.textContent = s.label + "…";
      if (analysisDone)    analysisDone.style.display = "none";
      if (analysisRunning) analysisRunning.style.display = "";

      // update step list
      stepEls.forEach((el, i) => {
        const dot = el.querySelector(".step-dot");
        const resultEl = el.querySelector(".step-result");
        if (i < stepIdx)  { el.dataset.state = "done"; if (resultEl) resultEl.style.display = ""; }
        else if (i === stepIdx) { el.dataset.state = "run"; el.style.background = "var(--panel-3)"; }
        else               { el.dataset.state = "wait"; el.style.background = "transparent"; }
      });

      const target = Math.round(((stepIdx + 1) / STEPS.length) * 100);
      animProgress(target);
      stepIdx++;
      setTimeout(updateStep, 520 + Math.random() * 480);
    }

    function animProgress(target) {
      const t = setInterval(() => {
        if (progress >= target) { clearInterval(t); return; }
        progress++;
        setProgress(progress, "var(--blue)");
      }, 14);
    }

    function setProgress(val, color) {
      if (progressBar) { progressBar.style.width = val + "%"; progressBar.style.background = color; }
      if (progressPct) progressPct.textContent = val + "%";
    }

    function addLogLine() {
      if (!logEl || logIdx >= LOG_LINES.length) return;
      const [txt, color] = LOG_LINES[logIdx];
      const line = document.createElement("div");
      line.className = "anim-fade-in";
      line.style.color = color;
      line.textContent = txt;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
      logIdx++;
      setTimeout(addLogLine, 340);
    }

    setTimeout(updateStep, 300);
    setTimeout(addLogLine, 200);
  }

  /* ── generic tabs ───────────────────────────────────────────────── */
  document.querySelectorAll(".ci-tab-group").forEach(group => {
    const tabs = group.querySelectorAll(".ci-tab[data-panel]");
    const panels = document.querySelectorAll(".ci-tab-panel");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        // deactivate all in group
        tabs.forEach(t => t.classList.remove("active"));
        // hide all panels in the same group
        const groupId = group.dataset.tabGroup;
        panels.forEach(p => { if (p.dataset.tabGroup === groupId) p.style.display = "none"; });
        // activate clicked
        tab.classList.add("active");
        const panel = document.getElementById(tab.dataset.panel);
        if (panel) panel.style.display = "";
      });
    });
  });

  /* ── impact graph tabs ──────────────────────────────────────────── */
  const graphTabBtns = document.querySelectorAll(".ci-graph-tab-btn[data-tab]");
  graphTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      graphTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".ci-graph-panel[data-tab]").forEach(p => {
        p.style.display = p.dataset.tab === btn.dataset.tab ? "" : "none";
      });
    });
  });

  /* ── filter chips (impact graph) ────────────────────────────────── */
  window.CI_graphCanvases = window.CI_graphCanvases || {};
  document.querySelectorAll(".ci-filter-chip[data-type]").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".ci-filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const type = chip.dataset.type === "all" ? null : chip.dataset.type;
      if (chip.dataset.type === "security") { window.location.href = "/security/"; return; }
      Object.values(window.CI_graphCanvases).forEach(gc => gc.setFilter(type));
    });
  });

  /* ── accordion / chevron toggles ────────────────────────────────── */
  document.querySelectorAll(".ci-accordion-trigger").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isOpen = target.style.display !== "none" && target.style.display !== "";
      target.style.display = isOpen ? "none" : "";
      const chevron = btn.querySelector(".ci-chevron");
      if (chevron) chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
    });
  });

  /* ── toggle switches ────────────────────────────────────────────── */
  document.querySelectorAll(".ci-toggle").forEach(tog => {
    // init visual state from data-on attribute
    if (tog.dataset.on === "true") tog.classList.add("on");
    tog.addEventListener("click", () => {
      tog.classList.toggle("on");
      const key = tog.dataset.settingKey;
      if (key) localStorage.setItem("ci-setting-" + key, tog.classList.contains("on") ? "1" : "0");
    });
  });

  /* ── analyze-change page ────────────────────────────────────────── */
  const analyzeForm = document.getElementById("ci-analyze-form");
  if (analyzeForm) {
    const textarea = document.getElementById("ci-change-textarea");
    const charCount = document.getElementById("ci-char-count");
    const analyzeBtn = document.getElementById("ci-analyze-btn");
    const enhanceBtn = document.getElementById("ci-enhance-btn");
    const questionsPanel = document.getElementById("ci-questions-panel");
    const specPanel = document.getElementById("ci-spec-panel");
    const generateBtn = document.getElementById("ci-generate-btn");
    const enhancedSpecText = document.getElementById("ci-enhanced-spec");

    if (textarea && charCount) {
      textarea.addEventListener("input", () => {
        charCount.textContent = textarea.value.trim().length + " CHARS · SIMULATION ONLY";
        const hasText = textarea.value.trim().length > 0;
        if (analyzeBtn) analyzeBtn.disabled = !hasText;
        if (enhanceBtn) enhanceBtn.disabled = !hasText;
      });
    }

    if (enhanceBtn && questionsPanel) {
      enhanceBtn.addEventListener("click", () => {
        questionsPanel.style.display = "";
        questionsPanel.classList.add("anim-fade-up");
      });
    }

    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<svg class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> GENERATING…`;
        fetch("/api/enhance-change/", { headers: { "X-CSRFToken": getCsrf() } })
          .then(r => r.json())
          .then(data => {
            if (specPanel) { specPanel.style.display = ""; specPanel.classList.add("anim-fade-up"); }
            if (questionsPanel) questionsPanel.style.display = "none";
            if (enhancedSpecText) enhancedSpecText.textContent = data.enhancedSpec;
            generateBtn.disabled = false;
          })
          .catch(() => { generateBtn.disabled = false; });
      });
    }

    // toggle question answers
    document.querySelectorAll(".ci-question-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const answer = btn.querySelector(".ci-question-answer");
        const tog = btn.querySelector(".ci-question-tog");
        if (answer) answer.style.display = answer.style.display === "none" ? "" : "none";
        if (tog)    tog.classList.toggle("on");
      });
    });

    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => {
        const change = textarea ? textarea.value.trim() : "";
        if (change) {
          if (window.CI_Loading) window.CI_Loading.show("Generating change impact report…");
          window.location.href = `/change-impact-report/?change=${encodeURIComponent(change)}`;
        }
      });
    }
    const specAnalyzeBtn = document.getElementById("ci-spec-analyze-btn");
    if (specAnalyzeBtn) {
      specAnalyzeBtn.addEventListener("click", () => {
        const change = textarea ? textarea.value.trim() : "";
        if (change) {
          if (window.CI_Loading) window.CI_Loading.show("Generating change impact report…");
          window.location.href = `/change-impact-report/?change=${encodeURIComponent(change)}`;
        }
      });
    }
  }

  /* ── add-project page ───────────────────────────────────────────── */
  const dropZone = document.getElementById("ci-drop-zone");
  const fileInput = document.getElementById("ci-file-input");
  const fileLabel = document.getElementById("ci-file-label");
  const uploadBtn = document.getElementById("ci-upload-btn");

  if (dropZone) {
    dropZone.addEventListener("click", () => fileInput?.click());
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.style.borderColor = "var(--blue)"; dropZone.style.background = "var(--blue-dim)"; });
    dropZone.addEventListener("dragleave", () => { dropZone.style.borderColor = ""; dropZone.style.background = ""; });
    dropZone.addEventListener("drop", e => {
      e.preventDefault(); dropZone.style.borderColor = ""; dropZone.style.background = "";
      const f = e.dataTransfer.files?.[0];
      if (f) setZipFile(f.name);
    });
  }
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files?.[0]) setZipFile(fileInput.files[0].name);
    });
  }
  function setZipFile(name) {
    if (fileLabel) fileLabel.textContent = name;
    if (uploadBtn) uploadBtn.disabled = false;
  }

  // GitHub auth toggle
  const authBtn = document.getElementById("ci-github-auth-btn");
  const preAuth = document.getElementById("ci-github-pre-auth");
  const postAuth = document.getElementById("ci-github-post-auth");
  if (authBtn && preAuth && postAuth) {
    authBtn.addEventListener("click", () => { preAuth.style.display = "none"; postAuth.style.display = ""; });
  }

  // URL input validation
  const urlInput = document.getElementById("ci-repo-url");
  const urlCheck = document.getElementById("ci-url-check");
  const urlAnalyzeBtn = document.getElementById("ci-url-analyze-btn");
  if (urlInput) {
    urlInput.addEventListener("input", () => {
      const valid = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(urlInput.value.trim());
      if (urlCheck) urlCheck.style.display = valid ? "" : "none";
      if (urlAnalyzeBtn) urlAnalyzeBtn.disabled = !valid;
    });
    urlInput.dispatchEvent(new Event("input"));
  }

  // repo select
  document.querySelectorAll(".ci-repo-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".ci-repo-card").forEach(c => {
        c.style.background = "var(--panel-2)";
        c.style.borderColor = "var(--border)";
      });
      card.style.background = "var(--blue-dim)";
      card.style.borderColor = "color-mix(in srgb, var(--blue) 45%, transparent)";
      const sel = document.getElementById("ci-repo-select");
      if (sel) sel.value = card.dataset.repo;
      const check = card.querySelector(".ci-repo-check");
      document.querySelectorAll(".ci-repo-check").forEach(c => c.style.display = "none");
      if (check) check.style.display = "";
    });
  });

  /* ── settings page ──────────────────────────────────────────────── */
  const copyTokenBtn = document.getElementById("ci-copy-token");
  if (copyTokenBtn) {
    copyTokenBtn.addEventListener("click", () => {
      const tokenValue = "ci_live_••••••••••••••••••••4f2a";
      navigator.clipboard?.writeText(tokenValue).catch(() => {});
      copyTokenBtn.innerHTML = checkIcon();
      setTimeout(() => { copyTokenBtn.innerHTML = copyIcon(); }, 1400);
    });
  }

  /* ── GitHub page: mock PR flow ──────────────────────────────────── */
  const runPrBtns = document.querySelectorAll("#ci-run-pr-btn, #ci-run-pr-analyze-btn, .ci-action-btn[data-action='pr-demo']");
  const prSteps = document.querySelectorAll(".ci-pr-step[data-step]");
  const reportPanel = document.getElementById("ci-pr-report-panel");
  const shareBtn = document.getElementById("ci-share-report-btn");
  const postCommentBtn = document.getElementById("ci-post-comment-btn");
  const commentPanel = document.getElementById("ci-comment-panel");
  const sharePanel = document.getElementById("ci-share-panel");

  if (runPrBtns.length > 0) {
    const PR_STEPS = ["fetching", "analyzing", "report", "preview"];
    const stepTimings = [0, 800, 1700, 3000];
    function runPrFlow(sourceBtn) {
      // disable all trigger buttons during the flow
      runPrBtns.forEach(b => b.disabled = true);
      PR_STEPS.forEach((step, i) => {
        setTimeout(() => {
          prSteps.forEach(el => {
            const s = el.dataset.step;
            const stepIdx = PR_STEPS.indexOf(s);
            el.dataset.state = stepIdx < i ? "complete" : stepIdx === i ? "active" : "queued";
            const stateEl = el.querySelector(".ci-pr-step-state");
            if (stateEl) {
              const colors = { complete: "var(--green)", active: "var(--blue)", queued: "var(--text-3)" };
              stateEl.style.color = colors[el.dataset.state];
              stateEl.textContent = { complete:"done", active:"running", queued:"queued" }[el.dataset.state];
            }
          });
          if (i === PR_STEPS.length - 1) {
            if (reportPanel) reportPanel.style.display = "";
            if (shareBtn)    shareBtn.style.display = "";
            if (postCommentBtn) postCommentBtn.style.display = "";
            runPrBtns.forEach(b => b.disabled = false);
          }
        }, stepTimings[i]);
      });
    }
    runPrBtns.forEach(btn => {
      // avoid double-registration with the generic .ci-action-btn[data-action] handler;
      // add a guard via a marker class
      if (btn.dataset.prBound) return;
      btn.dataset.prBound = "1";
      btn.addEventListener("click", () => runPrFlow(btn));
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      const text = `Change Impact report for PR #241 Add Google OAuth to auth service\nRisk: 87/100\nBlast radius: 18%\nConfidence: 91%`;
      navigator.clipboard?.writeText(text).catch(() => {});
      if (sharePanel) { sharePanel.style.display = ""; }
      shareBtn.textContent = "Report shared";
    });
  }

  if (postCommentBtn) {
    postCommentBtn.addEventListener("click", () => {
      if (commentPanel) { commentPanel.style.display = ""; }
      postCommentBtn.innerHTML = `${checkIcon()} Posted to GitHub`;
    });
  }

  /* ── compare branches / commits buttons (GitHub page) ───────────── */
  document.querySelectorAll(".ci-action-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const iconSpan = btn.querySelector(".ci-action-icon");
      if (iconSpan) iconSpan.innerHTML = spinnerIcon();
      btn.disabled = true;
      if (window.CI_Loading) window.CI_Loading.show("Analyzing comparison…");
      setTimeout(() => {
        if (iconSpan) iconSpan.innerHTML = checkIcon();
        btn.disabled = false;
        const action = btn.dataset.action;
        if (action === "impact") window.location.href = "/impact-analysis/";
      }, 1500);
    });
  });

  /* ── reports page: markdown download ────────────────────────────── */
  const downloadBtn = document.getElementById("ci-download-report");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (window.CI_Loading) window.CI_Loading.show("Preparing report download…");
      // hide loader after a brief moment since it's a navigation
      setTimeout(() => {
        if (window.CI_Loading) window.CI_Loading.hide();
      }, 1400);
      window.location.href = "/api/report/markdown/";
    });
  }

  /* ── what-if page: replay ────────────────────────────────────────── */
  const replayBtn = document.getElementById("ci-whatif-replay");
  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      if (window.CI_graphCanvases) {
        Object.values(window.CI_graphCanvases).forEach(gc => gc.reset());
      }
    });
  }

  /* ── impact analysis: security accordion ────────────────────────── */
  document.querySelectorAll(".ci-sec-accordion").forEach(item => {
    const trigger = item.querySelector(".ci-sec-trigger");
    const body    = item.querySelector(".ci-sec-body");
    const chevron = item.querySelector(".ci-chevron");
    if (trigger && body) {
      trigger.addEventListener("click", () => {
        const isOpen = body.style.display !== "none" && body.style.display !== "";
        // close all in the same group
        item.closest(".ci-sec-list")?.querySelectorAll(".ci-sec-body").forEach(b => b.style.display = "none");
        item.closest(".ci-sec-list")?.querySelectorAll(".ci-chevron").forEach(c => c.style.transform = "");
        if (!isOpen) {
          body.style.display = "";
          body.classList.add("anim-fade-in");
          if (chevron) chevron.style.transform = "rotate(180deg)";
        }
      });
    }
  });

  /* ── project insights tab switch ────────────────────────────────── */
  const insightTabs = document.querySelectorAll(".ci-insight-tab");
  const insightPanels = document.querySelectorAll(".ci-insight-panel");
  insightTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      insightTabs.forEach(t => t.classList.remove("active"));
      insightPanels.forEach(p => p.style.display = "none");
      tab.classList.add("active");
      const panel = document.getElementById("ci-insight-" + tab.dataset.tab);
      if (panel) panel.style.display = "";
    });
  });

  /* ── helpers ────────────────────────────────────────────────────── */
  function getCsrf() {
    const m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : "";
  }

  function sunIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`;
  }
  function moonIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>`;
  }
  function panelCloseIcon() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
    </svg>`;
  }
  function panelOpenIcon() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/>
    </svg>`;
  }
  function checkIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  }
  function copyIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  }
  function spinnerIcon() {
    return `<svg class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
  }

  window.CI_toggleTheme = toggleTheme;
})();
