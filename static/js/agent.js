/* ═══════════════════════════════════════════════════════════════════════════
   Change Impact – agent.js
   Full port of ImpactAgent.tsx → plain JS
   Renders the floating Impact Agent FAB + chat panel.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const quickPrompts = [
    "What does Change Impact do?",
    "How do I use the graph editor?",
    "Explain the Google Login risk.",
    "What should I review before shipping?",
  ];

  let messages = [
    {
      id: uid(), role: "agent",
      text: "I am the Change Impact Agent. Ask me about the current project, graph controls, what-if simulation, risk, blast radius, security impact, GitHub analysis, or reports.",
      actions: [
        { label: "Open Current Flow", view: "current-flow" },
        { label: "Analyze Change",    view: "analyze-change" },
      ],
    },
  ];

  let isOpen      = false;
  let isMinimized = false;

  /* ── root element ───────────────────────────────────────────────── */
  const root = document.getElementById("ci-agent-root");
  if (!root) return;

  function navigate(view) {
    window.location.href = `/${view}/`;
  }

  function renderFab() {
    root.innerHTML = `
      <button class="ci-agent-fab" id="ci-agent-fab-btn" title="Open Change Impact Agent" aria-label="Open Change Impact Agent">
        <span class="ci-agent-fab-ring1"></span>
        <span class="ci-agent-fab-ring2"></span>
        ${agentMarkHTML()}
      </button>`;
    root.querySelector("#ci-agent-fab-btn").addEventListener("click", () => { isOpen = true; render(); });
  }

  function renderPanel() {
    root.innerHTML = `
      <div class="ci-agent-panel${isMinimized ? " ci-agent-minimized" : ""}">
        <div class="ci-agent-header">
          ${agentMarkHTML()}
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="mono" style="font-size:11px;font-weight:700;letter-spacing:.12em;">IMPACT AGENT</span>
              <span class="ci-badge badge-green" style="height:17px;padding:0 6px;">LOCAL</span>
            </div>
            <div class="mono ci-text-3" style="font-size:8.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="ci-agent-context"></div>
          </div>
          <button id="ci-agent-minimize" title="${isMinimized ? "Expand" : "Minimize"}" style="border:none;background:transparent;cursor:pointer;color:var(--text-3);padding:4px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              style="transform:${isMinimized ? "rotate(180deg)" : "none"};transition:transform .15s;">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button id="ci-agent-close" title="Close" style="border:none;background:transparent;cursor:pointer;color:var(--text-3);padding:4px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ci-agent-body" id="ci-agent-msgs"></div>

        <div class="ci-agent-prompts" id="ci-agent-prompts"></div>

        <form class="ci-agent-form" id="ci-agent-form">
          <input id="ci-agent-input" placeholder="Ask about this analysis..." class="ci-input" style="height:34px;font-size:12px;">
          <button type="submit" class="ci-btn ci-btn-primary" style="height:34px;padding:0 12px;" id="ci-agent-send">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>`;

    // context line
    const ctx = root.querySelector("#ci-agent-context");
    if (ctx) ctx.textContent = window.CI_CONTEXT_LINE || "ecommerce-backend · 126 files · 341 functions · 42 APIs · Risk 87/100 · Blast radius 18/100 · Confidence 91%";

    // minimize / close
    root.querySelector("#ci-agent-minimize").addEventListener("click", () => { isMinimized = !isMinimized; render(); });
    root.querySelector("#ci-agent-close").addEventListener("click", () => { isOpen = false; render(); });

    // quick prompts
    const promptsEl = root.querySelector("#ci-agent-prompts");
    quickPrompts.forEach(q => {
      const btn = document.createElement("button");
      btn.className = "ci-chip"; btn.style.height = "24px"; btn.style.padding = "0 8px"; btn.style.fontSize = "10px";
      btn.textContent = q;
      btn.addEventListener("click", () => sendMessage(q));
      promptsEl.appendChild(btn);
    });

    // messages
    renderMessages();

    // form
    root.querySelector("#ci-agent-form").addEventListener("submit", e => { e.preventDefault(); sendMessage(); });
  }

  function renderMessages() {
    const msgsEl = root.querySelector("#ci-agent-msgs");
    if (!msgsEl) return;
    msgsEl.innerHTML = "";
    messages.forEach(msg => {
      const isAgent = msg.role === "agent";
      const row = document.createElement("div");
      row.className = `ci-bubble-row${isAgent ? "" : " user-row"}`;
      row.style.animationName = "ci-fade-in";
      row.style.animationDuration = "0.4s";

      if (isAgent) {
        const mini = document.createElement("span");
        mini.className = "ci-agent-mini";
        mini.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>`;
        row.appendChild(mini);
      }

      const bubble = document.createElement("div");
      bubble.className = isAgent ? "ci-bubble-agent" : "ci-bubble-user";

      const textDiv = document.createElement("div");
      textDiv.className = `ci-bubble-text${isAgent ? "" : " user"}`;
      textDiv.textContent = msg.text;
      bubble.appendChild(textDiv);

      if (isAgent && msg.actions?.length) {
        const acts = document.createElement("div");
        acts.className = "ci-bubble-actions";
        msg.actions.forEach(a => {
          const ab = document.createElement("button");
          ab.className = "ci-chip"; ab.style.height = "23px"; ab.style.padding = "0 8px"; ab.style.fontSize = "10px";
          ab.innerHTML = `${a.label} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
          ab.addEventListener("click", () => navigate(a.view));
          acts.appendChild(ab);
        });
        bubble.appendChild(acts);
      }

      row.appendChild(bubble);
      msgsEl.appendChild(row);
    });

    // scroll to bottom
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addThinkingBubble() {
    const msgsEl = root.querySelector("#ci-agent-msgs");
    if (!msgsEl) return;
    const row = document.createElement("div");
    row.className = "ci-bubble-row anim-fade-in";
    row.id = "ci-agent-thinking";
    const mini = document.createElement("span");
    mini.className = "ci-agent-mini";
    mini.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>`;
    row.appendChild(mini);
    const bubble = document.createElement("div");
    bubble.className = "ci-bubble-text";
    bubble.style.cssText = "display:flex;align-items:center;gap:4px;";
    bubble.innerHTML = `<span class="mono" style="font-size:10px;color:var(--text-3);">thinking</span>
      <span class="ci-thinking-dots">
        <i class="ci-thinking-dot pulse-dot" style="background:var(--blue);animation-delay:0s;"></i>
        <i class="ci-thinking-dot pulse-dot" style="background:var(--teal);animation-delay:.18s;"></i>
        <i class="ci-thinking-dot pulse-dot" style="background:var(--amber);animation-delay:.36s;"></i>
      </span>`;
    row.appendChild(bubble);
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function removeThinkingBubble() {
    const el = root.querySelector("#ci-agent-thinking");
    if (el) el.remove();
  }

  function sendMessage(text) {
    const input = root.querySelector("#ci-agent-input");
    const msg = (text ?? (input ? input.value : "")).trim();
    if (!msg) return;
    if (input) input.value = "";

    messages.push({ id: uid(), role: "user", text: msg });
    renderMessages();
    addThinkingBubble();

    const sendBtn = root.querySelector("#ci-agent-send");
    if (sendBtn) sendBtn.disabled = true;

    // Call backend agent API
    fetch("/api/agent/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrf() },
      body: JSON.stringify({ text: msg }),
    })
      .then(r => r.json())
      .then(data => {
        removeThinkingBubble();
        messages.push({ id: uid(), role: "agent", text: data.text, actions: data.actions || [] });
        renderMessages();
        if (sendBtn) sendBtn.disabled = false;
      })
      .catch(() => {
        removeThinkingBubble();
        messages.push({ id: uid(), role: "agent", text: "Sorry, I couldn't reach the server. Please try again.", actions: [] });
        renderMessages();
        if (sendBtn) sendBtn.disabled = false;
      });
  }

  function render() {
    if (!isOpen) { renderFab(); return; }
    renderPanel();
  }

  function agentMarkHTML() {
    return `
      <span class="ci-agent-mark">
        <span class="ci-agent-mark-bg"></span>
        <span class="ci-agent-mark-ring"></span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="1.5" style="position:relative;z-index:1;filter:drop-shadow(0 0 10px color-mix(in srgb,var(--teal) 35%,transparent));">
          <path d="M12 2a4 4 0 0 1 4 4v2h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"/>
          <path d="M9 14h.01M15 14h.01M9.5 18s1 1 2.5 1 2.5-1 2.5-1"/>
        </svg>
        <span class="ci-agent-mark-dot pulse-dot"></span>
        <svg class="ci-agent-mark-zap" width="9" height="9" viewBox="0 0 24 24" fill="var(--amber)" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
      </span>`;
  }

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function getCsrf() {
    const m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : "";
  }

  render();
})();
