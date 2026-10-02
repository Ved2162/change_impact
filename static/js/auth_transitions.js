/* ═══════════════════════════════════════════════════════════════════════════
   Change Impact – auth_transitions.js
   Premium logo-centered transition between the main app/home and the
   Login / Sign Up authentication pages.

   - No dependencies (vanilla JS).
   - Supports prefers-reduced-motion (all effects short-circuit instantly).
   - Works in both directions:
        main app/home  →  Login / Signup
        Login / Signup  →  main app/home (return from auth)
        Login          ↔  Signup (link inside auth forms)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const AUTH_PATHS = ["/login/", "/signup/"];
  const STORAGE_KEY = "ci-auth-transition"; // "to-auth" | "to-app" | ""
  const EXIT_MS = 420;          // source-page exit duration before navigation
  const MIN_ENTRANCE_MS = 900;  // entrance animation duration (matches CSS)
  const REDUCED_MOTION = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Helpers ───────────────────────────────────────────────────────── */
  const isAuthPath = (path) => AUTH_PATHS.includes(path) ||
    AUTH_PATHS.some(p => (path || "").startsWith(p));
  const isAuthPage = () => document.body.classList.contains("ci-auth-body") ||
    !!document.querySelector(".ci-auth-page");
  const setFlag = (v) => { try { sessionStorage.setItem(STORAGE_KEY, v); } catch (_) {} };
  const consumeFlag = () => {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return v;
    } catch (_) { return ""; }
  };

  const SVG_LOGO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2">' +
      '<circle cx="12" cy="5" r="2"></circle>' +
      '<circle cx="5" cy="19" r="2"></circle>' +
      '<circle cx="19" cy="19" r="2"></circle>' +
      '<line x1="12" y1="7" x2="5" y2="17"></line>' +
      '<line x1="12" y1="7" x2="19" y2="17"></line>' +
    '</svg>';

  function buildLogoHTML() {
    return (
      '<div class="ci-auth-transition-logo">' +
        '<div class="ci-auth-transition-logo-icon">' + SVG_LOGO + '</div>' +
        '<div class="ci-auth-transition-logo-text">' +
          '<span class="ci-auth-transition-logo-name">CHANGE<span>IMPACT</span></span>' +
          '<span class="ci-auth-transition-logo-sub">ANALYSIS WORKSPACE</span>' +
        '</div>' +
      '</div>'
    );
  }

  function ensureSourceOverlay() {
    let ov = document.querySelector(".ci-auth-transition-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "ci-auth-transition-overlay";
    ov.setAttribute("aria-hidden", "true");
    ov.innerHTML = buildLogoHTML();
    // Append as the first child of <body> so the :not() CSS exclusion catches it.
    document.body.insertBefore(ov, document.body.firstChild);
    return ov;
  }

  /* ── 1) Exiting from a SOURCE page (home/workspace OR auth page) ───── */

  /**
   * Run the exit animation on the current document, then navigate to url.
   * @param {string} url  - destination URL (login/signup or back to app)
   * @param {"to-auth"|"to-app"|"auth-inner"} mode
   */
  function navigateWithExit(url, mode) {
    // Short-circuit for reduced motion
    if (REDUCED_MOTION) {
      setFlag(mode === "auth-inner" ? "" : mode);
      window.location.href = url;
      return;
    }

    ensureSourceOverlay();

    // Remember mode so the destination can play the correct entrance
    setFlag(mode === "auth-inner" ? "" : mode);

    const isAuth = isAuthPage();

    if (isAuth) {
      // Leaving auth page — hero logo fades in at center, auth card scales/blurs out.
      document.body.classList.add("ci-auth-leaving");
      const exit = document.createElement("div");
      exit.className = "ci-auth-leaving-exit";
      exit.setAttribute("aria-hidden", "true");
      exit.innerHTML =
        '<div class="hero">' +
          '<div class="i">' + SVG_LOGO + '</div>' +
          '<div>' +
            '<div class="n">CHANGE<span>IMPACT</span></div>' +
            '<div class="s">ANALYSIS WORKSPACE</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(exit);
      setTimeout(() => { window.location.href = url; }, EXIT_MS);
    } else {
      // Leaving workspace/home — overlay logo + page fade/blur.
      document.body.classList.add("ci-auth-exit-active");
      const ov = document.querySelector(".ci-auth-transition-overlay");
      if (ov) ov.classList.add("is-active");
      setTimeout(() => { window.location.href = url; }, EXIT_MS);
    }
  }

  /* ── 2) Destination entrance — runs on page load ──────────────────── */

  function playAuthEntrance() {
    const flag = consumeFlag();
    const authPage = document.querySelector(".ci-auth-page");
    const authCard = document.querySelector(".ci-auth-card");
    if (!authPage) return;

    // If user navigated directly / refreshed — gentle fade of the card only
    if (flag !== "to-auth") {
      authPage.classList.add("soft-enter");
      return;
    }

    // Premium entrance: hero logo at center → morphs to card logo → card in
    document.body.classList.add("ci-auth-entrance");

    // Compute target (card logo) rectangle so hero flies *to* the real logo.
    // For simplicity we compute the flyout using FLIP-ish inline CSS vars
    // on the entrance-hero element.
    const logoEl = authCard.querySelector(".ci-auth-logo");
    let tx = 0, ty = 0, ts = 0.55; // defaults
    if (logoEl) {
      const cardRect = authCard.getBoundingClientRect();
      const logoRect = logoEl.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const logoCenterX = logoRect.left + logoRect.width / 2;
      const logoCenterY = logoRect.top + logoRect.height / 2;
      tx = logoCenterX - centerX;
      ty = logoCenterY - centerY;
      // scale ratio: hero icon 56px → card icon 32px
      ts = Math.max(0.45, 32 / 56);
      // Compensate a bit so the flyout "lands" near the card logo.
      // We fade out the hero before exact match to hide the jump.
    }

    const overlay = document.createElement("div");
    overlay.className = "ci-auth-entrance-full";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="ci-auth-entrance-hero" style="--tx:' + tx + 'px;--ty:' + ty + 'px;--ts:' + ts + ';">' +
        '<div class="icon">' + SVG_LOGO + '</div>' +
        '<div class="t">' +
          '<span class="n">CHANGE<span>IMPACT</span></span>' +
          '<span class="s">ANALYSIS WORKSPACE</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // Clean up the entrance overlay after animations finish
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.classList.remove("ci-auth-entrance");
    }, MIN_ENTRANCE_MS + 120);
  }

  function playReturnEntrance() {
    const flag = consumeFlag();
    if (flag !== "to-app") return;
    if (REDUCED_MOTION) return;
    ensureSourceOverlay();
    document.body.classList.add("ci-auth-return-enter");
    setTimeout(() => {
      document.body.classList.remove("ci-auth-return-enter");
    }, 650);
  }

  /* ── 3) Link interception ────────────────────────────────────────── */

  function isAuthNavLink(a) {
    if (!a || !a.href) return false;
    try {
      const u = new URL(a.href, window.location.origin);
      // Only intercept same-origin navigation to login/signup pages
      if (u.origin !== window.location.origin) return false;
      return isAuthPath(u.pathname);
    } catch (_) { return false; }
  }

  function isAppReturnLink(a) {
    if (!a || !a.href) return false;
    if (!isAuthPage()) return false; // only care about links INSIDE auth pages
    try {
      const u = new URL(a.href, window.location.origin);
      if (u.origin !== window.location.origin) return false;
      // Treat any non-auth internal URL link on auth pages as a "return to app".
      return !isAuthPath(u.pathname);
    } catch (_) { return false; }
  }

  function attachLinkInterceptors() {
    document.addEventListener("click", (ev) => {
      // Skip if modifier keys are held or new-tab is requested
      if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (ev.button !== undefined && ev.button !== 0) return;

      const a = ev.target.closest("a");
      if (!a) return;

      if (isAuthNavLink(a)) {
        ev.preventDefault();
        const dest = a.getAttribute("href");
        if (isAuthPage()) {
          // Login ↔ Signup inner navigation: soft exit to destination auth page
          navigateWithExit(dest, "to-auth");
        } else {
          // Workspace/home → auth page
          navigateWithExit(dest, "to-auth");
        }
      } else if (isAppReturnLink(a)) {
        ev.preventDefault();
        navigateWithExit(a.getAttribute("href"), "to-app");
      }
    }, true); // capture phase so we run before other handlers
  }

  /* ── 4) Also hook Django's implicit redirect (e.g. @login_required) ──
     When the server redirects the browser directly, there is no client
     link-click. We still want the auth page to show its soft-enter or the
     hero entrance if a prior exit stored the "to-auth" flag.
     That case is already handled by `playAuthEntrance` / the flags. */

  /* ── Init ──────────────────────────────────────────────────────────── */
  function init() {
    attachLinkInterceptors();

    if (isAuthPage()) {
      playAuthEntrance();
    } else {
      playReturnEntrance();
    }

    // Expose a small programmatic API for JS-initiated auth navigation.
    window.ChangeImpactAuth = {
      goLogin(url) { navigateWithExit(url || "/login/", "to-auth"); },
      goSignup(url) { navigateWithExit(url || "/signup/", "to-auth"); },
      goApp(url)   { navigateWithExit(url || "/",       "to-app");   },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL LOADER CONTROLLER
   - Exposes window.CI_Loading = { show, hide }
   - Auto-intercepts fetch(), XMLHttpRequest, login/signup/logout forms
   - Auto-intercepts sidebar navigation and slow page loads
   - Honors prefers-reduced-motion
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const LOADER_ID = "ci-global-loader";
  const STATUS_ID = "ci-loader-status";
  const SHOW_DELAY_MS = 260;   // don't flash for fast ops (<260ms)
  const MIN_DISPLAY_MS = 520;  // at least 520ms visible to avoid flicker
  const REDUCED_MOTION = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let refCount = 0;
  let showTimer = null;
  let hideTimer = null;
  let shownAt = 0;
  let currentStatusMsg = "";

  /* ── DOM accessors ──────────────────────────────────────────────── */
  function getLoader()  { return document.getElementById(LOADER_ID); }
  function getStatus()  { return document.getElementById(STATUS_ID); }

  /* ── public API ─────────────────────────────────────────────────── */
  function showLoader(message) {
    refCount++;
    if (message !== undefined) currentStatusMsg = message;
    _scheduleShow();
  }
  function hideLoader() {
    if (refCount > 0) refCount--;
    if (refCount <= 0) _scheduleHide();
  }
  function forceHideLoader() {
    refCount = 0;
    currentStatusMsg = "";
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    const ld = getLoader();
    if (ld) ld.classList.remove("is-visible");
    const st = getStatus();
    if (st) st.textContent = "";
  }

  /* ── internal scheduling ────────────────────────────────────────── */
  function _scheduleShow() {
    if (showTimer) return;
    // If the entry splash is still fading out, wait for it to finish before
    // showing the runtime loader — otherwise they fight each other mid-transition.
    const entryExiting = document.body.classList.contains("ci-entry-loading") ||
                         document.body.classList.contains("ci-entry-exiting");
    const baseDelay = REDUCED_MOTION ? 0 : SHOW_DELAY_MS;
    // If entry is still active we add a small extra buffer so the crossfade
    // (≤560ms) can finish first; the show delay already covers fast ops.
    const actualDelay = entryExiting ? Math.max(baseDelay, 600) : baseDelay;
    showTimer = setTimeout(() => {
      showTimer = null;
      const ld = getLoader();
      if (!ld) return;
      ld.classList.add("is-visible");
      const st = getStatus();
      if (st) st.textContent = currentStatusMsg || "";
      shownAt = Date.now();
    }, actualDelay);
  }

  function _scheduleHide() {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
      return; // never actually shown
    }
    if (hideTimer) return;
    const ld = getLoader();
    if (!ld || !ld.classList.contains("is-visible")) return;

    const elapsed = Date.now() - shownAt;
    const remaining = Math.max(0, (REDUCED_MOTION ? 0 : MIN_DISPLAY_MS) - elapsed);
    hideTimer = setTimeout(() => {
      hideTimer = null;
      const loader = getLoader();
      if (loader) loader.classList.remove("is-visible");
      const statusEl = getStatus();
      if (statusEl) statusEl.textContent = "";
      currentStatusMsg = "";
    }, remaining);
  }

  /* ── Intercept: login / signup / logout form submissions ────────── */
  function hookAuthForms() {
    document.addEventListener("submit", (ev) => {
      const form = ev.target;
      if (!form || form.tagName !== "FORM") return;
      const action = (form.getAttribute("action") || "").toLowerCase();

      let label = null;
      if (action.includes("/login/")) {
        label = "Signing you in…";
      } else if (action.includes("/signup/")) {
        label = "Creating your workspace…";
      } else if (action.includes("/logout/")) {
        label = "Signing you out…";
      }

      if (!label) {
        // also match any form that has a submit button with SIGN IN / CREATE / SIGN OUT text
        const submitBtns = form.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitBtns.forEach(btn => {
          const txt = (btn.textContent || btn.value || "").toUpperCase();
          if (!label) {
            if (txt.includes("SIGN IN") || txt.includes("LOGIN")) label = "Signing you in…";
            else if (txt.includes("CREATE")) label = "Creating your workspace…";
            else if (txt.includes("SIGN OUT") || txt.includes("LOGOUT")) label = "Signing you out…";
          }
        });
      }

      if (label) {
        // disable submit buttons to prevent double submit
        form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach(b => {
          b.disabled = true;
        });
        showLoader(label);
      }
    }, true);
  }

  /* ── Intercept: fetch() ──────────────────────────────────────────── */
  function hookFetch() {
    if (typeof window.fetch !== "function") return;
    const origFetch = window.fetch.bind(window);
    let activeFetches = 0;

    window.fetch = function () {
      const args = arguments;
      const url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url ? args[0].url : "");
      const method = (args[1] && args[1].method) ? args[1].method.toUpperCase() : "GET";

      let useLoader = false;
      let statusText = null;

      // Only auto-loader for certain known slow paths; skip tiny/polling requests
      if (url.indexOf("/api/agent/") !== -1 || url.indexOf("agent") !== -1 && method === "POST") {
        useLoader = true; statusText = "Impact agent is thinking…";
      } else if (url.indexOf("/api/enhance-change/") !== -1) {
        useLoader = true; statusText = "Enhancing change specification…";
      } else if (url.indexOf("/api/report/markdown/") !== -1) {
        useLoader = true; statusText = "Compiling markdown report…";
      } else if (method !== "GET" && url.indexOf("/api/") !== -1) {
        useLoader = true; statusText = "Processing request…";
      }

      if (useLoader) {
        activeFetches++;
        showLoader(statusText);
      }

      const promise = origFetch.apply(this, args);
      promise.finally(() => {
        if (useLoader) {
          activeFetches--;
          if (activeFetches <= 0) hideLoader();
        }
      });
      return promise;
    };
  }

  /* ── Intercept: XMLHttpRequest ───────────────────────────────────── */
  function hookXHR() {
    if (typeof window.XMLHttpRequest === "undefined") return;
    const origOpen = window.XMLHttpRequest.prototype.open;
    const origSend = window.XMLHttpRequest.prototype.send;
    let activeXHR = 0;

    window.XMLHttpRequest.prototype.open = function (method, url) {
      this.__ci_url = url || "";
      this.__ci_method = (method || "GET").toUpperCase();
      return origOpen.apply(this, arguments);
    };
    window.XMLHttpRequest.prototype.send = function () {
      const url = this.__ci_url || "";
      const method = this.__ci_method || "GET";
      let useLoader = url.indexOf("/api/") !== -1 && method !== "GET";
      if (useLoader) {
        activeXHR++;
        showLoader("Processing request…");
      }
      const done = () => {
        try { this.removeEventListener("loadend", done); } catch (_) {}
        if (useLoader) {
          activeXHR--;
          if (activeXHR <= 0) hideLoader();
        }
      };
      try { this.addEventListener("loadend", done); } catch (_) {}
      return origSend.apply(this, arguments);
    };
  }

  /* ── Intercept: sidebar navigation clicks ────────────────────────── */
  function hookNavClicks() {
    document.addEventListener("click", (ev) => {
      if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (ev.button !== undefined && ev.button !== 0) return;

      const a = ev.target.closest("a");
      if (!a || !a.href) return;

      let isAppNav = false;
      // Sidebar nav items (data-view)
      if (a.classList && a.classList.contains("ci-nav-item") && a.dataset && a.dataset.view) {
        isAppNav = true;
      }
      // Home view CTA buttons link to other workspace views
      if (!isAppNav) {
        try {
          const u = new URL(a.href, window.location.origin);
          if (u.origin === window.location.origin) {
            const workspacePages = [
              "/add-project/", "/analysis/", "/overview/", "/current-flow/",
              "/project-insights/", "/dependencies/", "/security/", "/environment/",
              "/analyze-change/", "/what-if/", "/impact-analysis/", "/impact-graph/",
              "/change-impact-report/", "/before-after/", "/github/", "/reports/",
              "/history/", "/settings/", "/home/"
            ];
            if (workspacePages.some(p => u.pathname === p || u.pathname.startsWith(p))) {
              // Only show loader if navigating AWAY from current page
              if (u.pathname !== location.pathname) isAppNav = true;
            }
          }
        } catch (_) {}
      }

      if (isAppNav) {
        // Don't prevent default; page will navigate so we show loader briefly
        showLoader("Loading workspace…");
      }
    }, true);
  }

  /* ── Intercept: beforeunload (stuck-loader safety) ──────────────── */
  function hookUnloadSafety() {
    window.addEventListener("pagehide", forceHideLoader);
    window.addEventListener("beforeunload", forceHideLoader);
  }

  /* ── Expose programmatic API ────────────────────────────────────── */
  window.CI_Loading = {
    show: showLoader,
    hide: hideLoader,
    forceHide: forceHideLoader,
  };

  /* ── Init ────────────────────────────────────────────────────────── */
  function controllerInit() {
    hookAuthForms();
    hookFetch();
    hookXHR();
    hookNavClicks();
    hookUnloadSafety();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", controllerInit, { once: true });
  } else {
    controllerInit();
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   ENTRY SPLASH LOADER
   - Every page ships with <body class="ci-entry-loading"> baked into HTML
   - CSS keeps the brand logo loader visible AND page content hidden (opacity:0)
     BEFORE any JS ever runs → on reload / hard refresh / navigation, the splash
     is the first thing the user sees.
   - Here we wait for window.load (fully parsed CSS + fonts + images), then hold
     the splash for a minimum grace period so the animation is actually visible,
     then remove ci-entry-loading → CSS crossfades the loader out and the page up.
   - If the page already had ci-entry-loading removed (e.g. on a very fast hot
     reload), this is a no-op.
   - Honors prefers-reduced-motion (splash shows 0ms → instant reveal).
   - Backstop: if load event never fires, hard-dismiss at 6s anyway.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const REDUCED_MOTION = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MIN_SPLASH_MS = REDUCED_MOTION ? 0 : 720;   // time splash is guaranteed to show
  const LOAD_TIMEOUT_MS = 6000;                       // absolute safety fallback
  const startedAt = performance.now();
  let done = false;

  function dismissEntryLoader() {
    if (done) return;
    done = true;
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

    setTimeout(() => {
      // Add bridge class BEFORE removing ci-entry-loading so the loader
      // fades out smoothly without being hijacked by a runtime .is-visible
      // toggle that might fire in the same tick (e.g. an immediate form submit).
      document.body.classList.add("ci-entry-exiting");
      document.body.classList.remove("ci-entry-loading");

      // After the page crossfade completes, drop the bridge class so the
      // runtime loader can freely use .is-visible again (fetch / form submit).
      const CROSSFADE_MS = REDUCED_MOTION ? 0 : 560;
      setTimeout(() => {
        document.body.classList.remove("ci-entry-exiting");
        // Emit signal so other modules know the entry splash is fully gone.
        window.dispatchEvent(new CustomEvent("ci:entry-revealed"));
      }, CROSSFADE_MS);
    }, remaining);
  }

  function onLoad() {
    dismissEntryLoader();
  }

  /* try the load event — window fully ready */
  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad, { once: true });
  }

  /* also trigger on DOMContentLoaded as a fallback trigger if load is delayed
     by images/etc that are heavy — splash will still wait MIN_SPLASH_MS */
  if (document.readyState === "interactive" || document.readyState === "complete") {
    // already interactive; just let load handle it
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      // start counting from now as a secondary trigger (optional secondary backoff)
      // we don't actually dismiss early — but use this to start a timer of its own
      setTimeout(() => {
        if (!done) dismissEntryLoader();
      }, 3500); // if load hasn't fired after parsing + 3.5s, go ahead
    }, { once: true });
  }

  /* absolute safety: dismiss no later than LOAD_TIMEOUT_MS from page start */
  setTimeout(() => { if (!done) dismissEntryLoader(); }, LOAD_TIMEOUT_MS);
})();
