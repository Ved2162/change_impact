/* ═══════════════════════════════════════════════════════════════════════════
   Change Impact – home.js
   Port of the animated simulation console loop from Home.tsx
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const PHASES = [
    "READING SOURCE", "FUNCTION DETECTED", "DEPENDENCIES DISCOVERED",
    "CONNECTIONS CREATED", "IMPACT PATH HIGHLIGHTED", "RISK DETECTED",
  ];

  const CODE_LINES = [
    { text: "def authenticate_user(email, password):", color: "var(--text-1)" },
    { text: "    token = validate_token(request)",     color: "var(--text-2)" },
    { text: "    return issue_jwt(user)  # RS256, 15m exp", color: "var(--text-2)" },
  ];

  let step = 0;

  /* ── element refs ──────────────────────────────────────────────── */
  const codeLines   = document.querySelectorAll(".home-code-line");
  const fnChip      = document.getElementById("home-chip-fn");
  const depsChip    = document.getElementById("home-chip-deps");
  const connChip    = document.getElementById("home-chip-conn");
  const phaseLabel  = document.getElementById("home-phase-label");
  const loopCounter = document.getElementById("home-loop-counter");
  const hudCells    = document.querySelectorAll(".home-hud-cell");
  const heroNodes   = document.querySelectorAll(".hero-node");
  const heroEdges   = document.querySelectorAll(".hero-edge");
  const heroHot     = document.querySelectorAll(".hero-hot-ring");

  if (!phaseLabel) return; // not on home page

  function update() {
    /* code line visibility */
    codeLines.forEach((el, i) => {
      const on = step >= i;
      el.style.opacity      = on ? "1" : "0.14";
      el.style.transition   = "opacity .4s";
      el.style.background   = (i === 0 && step >= 4) ? "var(--blue-dim)" : "transparent";
      el.style.borderRadius = "3px";
      el.style.padding      = "0 4px";
      el.style.margin       = "0 -4px";
    });

    /* chips */
    applyChip(fnChip,   step >= 4);
    applyChip(depsChip, step >= 9);
    applyChip(connChip, step >= 10);

    /* hero nodes */
    heroNodes.forEach((el, i) => {
      const on = step >= 5 + i;
      el.style.opacity    = on ? "1" : "0";
      el.style.transform  = on ? "scale(1)" : "scale(0.9)";
      el.style.transition = "all .5s cubic-bezier(.22,.9,.3,1)";
    });

    /* hero edges */
    heroEdges.forEach(el => {
      const on = step >= 10;
      el.style.strokeDashoffset = on ? "0" : "120";
    });

    /* hot ring */
    const hot = step >= 12;
    heroHot.forEach(el => { el.style.opacity = hot ? "0.65" : "0"; });

    /* edge colors */
    heroEdges.forEach(el => {
      el.setAttribute("stroke", hot ? "var(--red)" : "var(--graph-line)");
      el.setAttribute("stroke-width", hot ? "1.8" : "1.2");
    });

    /* HUD */
    const hudOn = step >= 14;
    hudCells.forEach(el => { el.style.opacity = hudOn ? "1" : "0.28"; el.style.transition = "opacity .5s"; });
    const hudValues = ["DETECTED", "18%", "HIGH", "91%"];
    hudCells.forEach((el, i) => {
      const vEl = el.querySelector(".hud-value");
      if (vEl) vEl.textContent = hudOn ? hudValues[i] : "—";
    });

    /* phase */
    const phase = Math.min(PHASES.length - 1, Math.max(0, Math.floor((step - 3) / 3)));
    phaseLabel.textContent = step < 3 ? PHASES[0] : PHASES[phase];
    if (loopCounter) loopCounter.textContent = `LOOP ${String(step + 1).padStart(2,"0")}/24 · RESET AUTOMATIC`;

    /* fading console on reset */
    const fading = step >= 21;
    const consoleRight = document.querySelector(".home-console-right");
    if (consoleRight) { consoleRight.style.opacity = fading ? "0.35" : "1"; consoleRight.style.transition = "opacity .5s"; }

    step = (step + 1) % 24;
  }

  function applyChip(el, on) {
    if (!el) return;
    el.style.opacity   = on ? "1" : "0.18";
    el.style.transform = on ? "translateY(0)" : "translateY(3px)";
    el.style.transition = "all .45s cubic-bezier(.22,.9,.3,1)";
  }

  setInterval(update, 620);
  update();
})();
