/* ═══════════════════════════════════════════════════════════════════════════
   Change Impact – graph.js
   Full port of GraphCanvas.tsx → plain SVG + JS
   Usage: new GraphCanvas(containerEl, data, options)
   ═══════════════════════════════════════════════════════════════════════════ */

const NODE_W = 208;
const NODE_H = 82;

const NODE_TYPE_META = {
  api:        { label: "API",          color: "var(--blue)",   dim: "var(--blue-dim)",   letter: "A" },
  function:   { label: "Function",     color: "var(--green)",  dim: "var(--green-dim)",  letter: "ƒ" },
  class:      { label: "Class",        color: "var(--violet)", dim: "var(--violet-dim)", letter: "C" },
  service:    { label: "Service",      color: "var(--teal)",   dim: "var(--teal-dim)",   letter: "S" },
  database:   { label: "Database",     color: "var(--amber)",  dim: "var(--amber-dim)",  letter: "D" },
  dependency: { label: "Dependency",   color: "var(--amber)",  dim: "var(--amber-dim)",  letter: "p" },
  env:        { label: "Env Variable", color: "var(--teal)",   dim: "var(--teal-dim)",   letter: "$" },
  test:       { label: "Test",         color: "var(--green)",  dim: "var(--green-dim)",  letter: "T" },
  external:   { label: "External",     color: "var(--text-3)", dim: "var(--panel-3)",    letter: "E" },
  file:       { label: "File",         color: "var(--text-3)", dim: "var(--panel-3)",    letter: "F" },
  user:       { label: "User",         color: "var(--violet)", dim: "var(--violet-dim)", letter: "U" },
};

const IMPACT_COLOR = { high: "var(--red)", medium: "var(--amber)", low: "var(--blue)" };
const STATUS_COLOR = {
  added: "var(--green)", removed: "var(--red)", modified: "var(--amber)",
  affected: "var(--blue)", unchanged: "var(--border-2)",
};

let _uid = 0;
const nextId = (p) => `${p}-${Date.now().toString(36)}-${(_uid++).toString(36)}`;
const trunc  = (s, n) => !s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s;
const clamp  = (v, a, b) => Math.min(b, Math.max(a, v));

/* ── SVG namespace helper ── */
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GraphCanvas class
   ═══════════════════════════════════════════════════════════════════════════ */
class GraphCanvas {
  constructor(container, data, options = {}) {
    this.container = container;
    this.accent    = options.accent    ?? "default";   // "default"|"impact"|"diff"|"sim"
    this.editable  = options.editable  ?? true;
    this.animIntro = options.animateIntro ?? false;
    this.legendHint= options.legendHint ?? null;
    this.graphKey  = options.graphKey  ?? "graph";
    this.filterProp= options.filter    ?? null;        // external NodeType filter

    // mutable state
    this.nodes      = data.nodes.map(n => ({...n}));
    this.edges      = data.edges.map(e => ({...e}));
    this.origData   = data;
    this.view       = { x: 0, y: 0, k: 1 };
    this.sel        = new Set();
    this.selEdge    = null;
    this.focusId    = null;
    this.showPaths  = true;
    this.query      = "";
    this.typeFilter = null;
    this.connectFrom= null;
    this.marquee    = null;

    this._drag = {
      mode: "pan", sx: 0, sy: 0, vx: 0, vy: 0,
      start: new Map(), moved: false, shift: false,
      downId: null, shiftToggled: false
    };
    this._captureId = null;

    this._build();
    this._attachWheel();
    this._fitLater();
  }

  /* ── DOM build ─────────────────────────────────────────────────── */
  _build() {
    const c = this.container;
    c.classList.add("ci-grid-bg");
    c.style.position   = "relative";
    c.style.overflow   = "hidden";
    c.style.userSelect = "none";
    c.style.outline    = "none";
    c.tabIndex = 0;

    // SVG canvas
    this.svg = svgEl("svg", { class: "ci-graph-svg" });
    this.svg.style.cssText = "width:100%;height:100%;display:block;cursor:grab;";
    c.appendChild(this.svg);

    // defs
    this._buildDefs();

    // main group (panned/zoomed)
    this.gMain = svgEl("g");
    this.svg.appendChild(this.gMain);

    this.gEdges = svgEl("g"); this.gMain.appendChild(this.gEdges);
    this.gNodes = svgEl("g"); this.gMain.appendChild(this.gNodes);
    this.gMarquee = svgEl("g"); this.gMain.appendChild(this.gMarquee);

    this._buildToolbar();
    this._buildStatusBar();
    this._buildLegend();

    this._attachSvgPointer();
    this._attachKeyboard();
    this._render();
  }

  _buildDefs() {
    const defs = svgEl("defs");
    const markerDefs = [
      ["arr-gray",     "var(--graph-line)"],
      ["arr-high",     IMPACT_COLOR.high],
      ["arr-medium",   IMPACT_COLOR.medium],
      ["arr-low",      IMPACT_COLOR.low],
      ["arr-added",    STATUS_COLOR.added],
      ["arr-removed",  STATUS_COLOR.removed],
      ["arr-modified", STATUS_COLOR.modified],
      ["arr-info",     "var(--blue)"],
    ];
    markerDefs.forEach(([id, fill]) => {
      const m = svgEl("marker", { id, viewBox:"0 0 10 10", refX:"9", refY:"5",
        markerWidth:"7.5", markerHeight:"7.5", orient:"auto-start-reverse" });
      const p = svgEl("path", { d:"M 0 1.5 L 9 5 L 0 8.5 z", fill });
      m.appendChild(p); defs.appendChild(m);
    });
    this.svg.appendChild(defs);
  }

  _buildToolbar() {
    const tb = document.createElement("div");
    tb.className = "ci-graph-toolbar";

    // search
    const searchWrap = document.createElement("div");
    searchWrap.className = "ci-graph-search";
    searchWrap.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
    this._searchInput = document.createElement("input");
    this._searchInput.placeholder = "Search nodes…";
    this._searchInput.addEventListener("input", e => { this.query = e.target.value; this._render(); });
    this._searchCount = document.createElement("span");
    this._searchCount.style.cssText = "font-family:monospace;font-size:9.5px;color:var(--blue);";
    searchWrap.appendChild(this._searchInput);
    searchWrap.appendChild(this._searchCount);
    tb.appendChild(searchWrap);

    // type select
    this._typeSelect = document.createElement("select");
    this._typeSelect.style.cssText = "height:30px;border-radius:5px;font-size:11px;padding:0 8px;outline:none;cursor:pointer;background:var(--panel);border:1px solid var(--border-2);color:var(--text-2);";
    this._typeSelect.innerHTML = `<option value="">All types</option>` +
      Object.entries(NODE_TYPE_META).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join("");
    this._typeSelect.addEventListener("change", e => { this.typeFilter = e.target.value || null; this._render(); });
    tb.appendChild(this._typeSelect);

    // icon buttons
    const btns = [
      { title:"Highlight paths (S)", icon: pathIcon(), action: () => { this.showPaths = !this.showPaths; this._render(); }, key:"paths" },
      { title:"Focus selected node", icon: crosshairIcon(), action: () => this._focusSelected(), key:"focus" },
      { title:null, sep:true },
      { title:"Fit view",   icon: fitIcon(),    action: () => this.fitView() },
      { title:"Auto layout",icon: layoutIcon(), action: () => this.autoLayout() },
      { title:"Reset graph",icon: resetIcon(),  action: () => this.reset() },
      { title:"Zoom out",   icon: zoomOutIcon(),action: () => this.zoomBy(0.8) },
    ];
    btns.forEach(b => {
      if (b.sep) { const d=document.createElement("div"); d.style.cssText="width:1px;height:18px;background:var(--border-2);"; tb.appendChild(d); return; }
      const btn = document.createElement("button");
      btn.className = "ci-graph-toolbtn"; btn.title = b.title;
      btn.innerHTML = b.icon; btn.addEventListener("click", b.action);
      if (b.key === "paths") this._pathsBtn = btn;
      if (b.key === "focus") this._focusBtn = btn;
      tb.appendChild(btn);
    });

    // zoom %
    this._zoomLabel = document.createElement("span");
    this._zoomLabel.style.cssText = "font-family:monospace;font-size:10px;color:var(--text-3);width:36px;text-align:center;";
    this._zoomLabel.textContent = "100%";
    tb.appendChild(this._zoomLabel);

    const zoomInBtn = document.createElement("button");
    zoomInBtn.className = "ci-graph-toolbtn"; zoomInBtn.title = "Zoom in";
    zoomInBtn.innerHTML = zoomInIcon(); zoomInBtn.addEventListener("click", () => this.zoomBy(1.25));
    tb.appendChild(zoomInBtn);

    if (this.editable) {
      const sep2 = document.createElement("div"); sep2.style.cssText="width:1px;height:18px;background:var(--border-2);"; tb.appendChild(sep2);
      const addBtn = document.createElement("button");
      addBtn.className = "ci-btn ci-btn-primary"; addBtn.style.height = "30px";
      addBtn.innerHTML = `${plusIcon()} Add Node`;
      addBtn.addEventListener("click", () => this._openAddDialog());
      tb.appendChild(addBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "ci-graph-toolbtn"; delBtn.title = "Delete selection";
      delBtn.innerHTML = trashIcon(); delBtn.addEventListener("click", () => this._deleteSelection());
      this._delBtn = delBtn;
      tb.appendChild(delBtn);
    }

    const sep3 = document.createElement("div"); sep3.style.cssText="width:1px;height:18px;background:var(--border-2);"; tb.appendChild(sep3);
    const expBtn = document.createElement("button");
    expBtn.className = "ci-graph-toolbtn"; expBtn.title = "Export SVG";
    expBtn.innerHTML = downloadIcon(); expBtn.addEventListener("click", () => this._exportSvg());
    tb.appendChild(expBtn);

    this.container.appendChild(tb);
    this._toolbar = tb;
  }

  _buildStatusBar() {
    const sb = document.createElement("div");
    sb.className = "ci-graph-statusbar";
    this._statusBar = sb;
    this.container.appendChild(sb);
  }

  _buildLegend() {
    if (this.accent === "default" && !this.legendHint) return;
    const leg = document.createElement("div");
    leg.className = "ci-graph-legend";
    if (this.legendHint) {
      const s = document.createElement("span");
      s.style.cssText = "font-family:monospace;font-size:9.5px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;";
      s.textContent = this.legendHint; leg.appendChild(s);
    }
    const items = this.accent === "impact"
      ? [["var(--red)","High impact"],["var(--amber)","Medium"],["var(--blue)","Low"]]
      : this.accent === "diff"
      ? [["var(--green)","Added"],["var(--amber)","Modified"],["var(--blue)","Affected"],["var(--red)","Removed"]]
      : this.accent === "sim"
      ? [["var(--green)","Introduced"],["var(--blue)","Propagates to"]]
      : [];
    items.forEach(([c, l]) => {
      const d = document.createElement("span");
      d.className = "ci-graph-legend-dot";
      d.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block;"></span><span class="ci-legend-label" style="font-size:9.5px;">${l}</span>`;
      leg.appendChild(d);
    });
    this.container.appendChild(leg);
  }

  /* ── rendering ─────────────────────────────────────────────────── */
  _render() {
    this._applyTransform();
    this._renderEdges();
    this._renderNodes();
    this._renderMarquee();
    this._updateStatusBar();
    this._updateToolbarState();
  }

  _applyTransform() {
    const { x, y, k } = this.view;
    this.gMain.setAttribute("transform", `translate(${x},${y}) scale(${k})`);
    this._zoomLabel && (this._zoomLabel.textContent = `${Math.round(k * 100)}%`);
  }

  _nodeOpacity(id) {
    const n = this.nodes.find(x => x.id === id);
    if (!n) return 1;
    const tf = this.filterProp !== null && this.filterProp !== undefined ? this.filterProp : this.typeFilter;
    if (tf && n.type !== tf) return 0.07;
    if (this.focusId && !this._neighborSet(this.focusId).has(id)) return 0.12;
    const matches = this._matches();
    if (matches && !matches.has(id)) return 0.18;
    if (!this.focusId && this.showPaths && this.sel.size === 1 && !this._reachSet([...this.sel][0]).has(id)) return 0.16;
    return 1;
  }

  _edgeOpacity(e) {
    const o = Math.min(this._nodeOpacity(e.source), this._nodeOpacity(e.target));
    if (this.showPaths && this.sel.size === 1 && !this.focusId) {
      const keep = this._reachSet([...this.sel][0]);
      if (!(keep.has(e.source) && keep.has(e.target))) return 0.08;
    }
    return o === 1 ? 1 : o * 0.8;
  }

  _matches() {
    if (!this.query.trim()) return null;
    const q = this.query.toLowerCase();
    return new Set(this.nodes.filter(n =>
      n.name.toLowerCase().includes(q) || (n.tech||"").toLowerCase().includes(q) || n.type.includes(q)
    ).map(n => n.id));
  }

  _adj() {
    const down = new Map(), up = new Map();
    this.edges.forEach(e => {
      if (!down.has(e.source)) down.set(e.source, []);
      if (!up.has(e.target)) up.set(e.target, []);
      down.get(e.source).push(e.target);
      up.get(e.target).push(e.source);
    });
    return { down, up };
  }

  _reachSet(start) {
    const { down, up } = this._adj();
    const keep = new Set([start]);
    const walk = (map) => {
      const q = [start];
      while (q.length) {
        const c = q.pop();
        (map.get(c)||[]).forEach(n => { if (!keep.has(n)) { keep.add(n); q.push(n); } });
      }
    };
    walk(down); walk(up);
    return keep;
  }

  _neighborSet(id) {
    const { down, up } = this._adj();
    const s = new Set([id]);
    (down.get(id)||[]).forEach(n => s.add(n));
    (up.get(id)||[]).forEach(n => s.add(n));
    return s;
  }

  _edgeColor(e) {
    if (this.accent === "impact" && e.impact) return { stroke: IMPACT_COLOR[e.impact], marker: `arr-${e.impact}`, hot: true };
    if ((this.accent === "diff" || this.accent === "sim") && e.status) return { stroke: STATUS_COLOR[e.status], marker: `arr-${e.status}`, hot: true };
    return { stroke: "var(--graph-line)", marker: "arr-gray", hot: false };
  }

  _edgePath(e) {
    const s = this.nodes.find(n => n.id === e.source);
    const t = this.nodes.find(n => n.id === e.target);
    if (!s || !t) return "";
    const x1 = s.x + NODE_W/2, y1 = s.y + NODE_H;
    const x2 = t.x + NODE_W/2, y2 = t.y;
    const dy = Math.abs(y2 - y1);
    const o  = clamp(dy * 0.45, 36, 110);
    if (y2 >= y1) return `M ${x1} ${y1} C ${x1} ${y1+o}, ${x2} ${y2-o}, ${x2} ${y2}`;
    return `M ${x1} ${s.y} C ${x1} ${s.y-o}, ${x2} ${y2+NODE_H+o}, ${x2} ${y2+NODE_H}`;
  }

  _edgeMid(e) {
    const s = this.nodes.find(n => n.id === e.source);
    const t = this.nodes.find(n => n.id === e.target);
    if (!s || !t) return { x:0, y:0 };
    return { x:(s.x+t.x+NODE_W)/2, y:(s.y+t.y+NODE_H)/2 };
  }

  _renderEdges() {
    this.gEdges.innerHTML = "";
    this.edges.forEach((e, i) => {
      const d = this._edgePath(e);
      if (!d) return;
      const c = this._edgeColor(e);
      const isSel = this.selEdge === e.id;
      const opacity = this._edgeOpacity(e);
      const mid = this._edgeMid(e);

      const g = svgEl("g");
      g.style.opacity = opacity;
      if (this.animIntro) g.style.animation = `ci-fade-in .5s ${0.5 + i*0.16}s both`;

      // hit area
      const hit = svgEl("path", { d, fill:"none", stroke:"transparent", "stroke-width":"14" });
      hit.style.pointerEvents = "stroke";
      hit.style.cursor = this.editable ? "pointer" : "default";
      hit.addEventListener("pointerdown", ev => {
        ev.stopPropagation();
        if (this.editable) { this.selEdge = e.id; this.sel.clear(); this._render(); this._renderInspector(); }
      });

      const strokeW = isSel ? 2.2 : c.hot ? 1.6 : 1.2;
      const strokeClr = isSel ? "var(--blue)" : c.stroke;
      const dashArr = e.indirect ? "5 6" : e.status === "added" ? "7 7" : null;
      const path = svgEl("path", {
        d, fill:"none", stroke: strokeClr, "stroke-width": strokeW,
        "marker-end": `url(#${isSel ? "arr-info" : c.marker})`
      });
      if (dashArr) path.setAttribute("stroke-dasharray", dashArr);
      if (e.status === "added" && !e.indirect) path.classList.add("edge-anim");
      if (this.animIntro && !(e.status === "added")) {
        path.style.setProperty("--draw-len", "600");
        path.style.animation = `ci-draw .8s ${0.5 + i*0.16}s both`;
      }

      g.appendChild(hit); g.appendChild(path);

      if (e.label) {
        const txt = svgEl("text", { x: mid.x, y: mid.y-4, "text-anchor":"middle", "font-size":"8.5", "font-family":"JetBrains Mono, monospace", fill:"var(--text-3)", "letter-spacing":"0.08em" });
        txt.textContent = e.label.toUpperCase();
        g.appendChild(txt);
      }
      this.gEdges.appendChild(g);
    });
  }

  _renderNodes() {
    this.gNodes.innerHTML = "";
    const matches = this._matches();
    this.nodes.forEach((n, i) => {
      const meta = NODE_TYPE_META[n.type] || NODE_TYPE_META.file;
      const isSel = this.sel.has(n.id);
      const isMatch = matches?.has(n.id);
      const opacity = this._nodeOpacity(n.id);

      const stroke =
        this.accent === "impact" && n.impact ? IMPACT_COLOR[n.impact] :
        (this.accent === "diff" || this.accent === "sim") && n.status ? STATUS_COLOR[n.status] :
        "var(--border-2)";

      const { down, up } = this._adj();
      const outC = (down.get(n.id)||[]).length;
      const incC = (up.get(n.id)||[]).length;

      const g = svgEl("g");
      g.style.opacity = opacity;
      g.style.cursor = this.connectFrom ? "crosshair" : this.editable ? "grab" : "default";
      if (this.animIntro) g.style.animation = `ci-fade-in .5s ${i*0.07}s both`;

      g.setAttribute("transform", `translate(${n.x - NODE_W/2},${n.y})`);
      g.dataset.nodeId = n.id;

      // selection ring
      if (isSel || isMatch) {
        const ring = svgEl("rect", { x:-4, y:-4, width:NODE_W+8, height:NODE_H+8, rx:8, fill:"none", stroke:"var(--blue)", "stroke-width":1.6, opacity: isMatch && !isSel ? 0.55 : 0.95 });
        g.appendChild(ring);
      }
      if (this.focusId === n.id) {
        const fr = svgEl("rect", { x:-9, y:-9, width:NODE_W+18, height:NODE_H+18, rx:10, fill:"none", stroke:"var(--blue)", "stroke-width":1, opacity:0.35 });
        g.appendChild(fr);
      }

      // card bg
      g.appendChild(svgEl("rect", { width:NODE_W, height:NODE_H, rx:6, fill:"var(--panel-2)", stroke: isSel ? "var(--blue)" : stroke, "stroke-width": isSel ? 1.6 : 1.2 }));
      // left accent strip
      g.appendChild(svgEl("rect", { x:0.7, y:0.7, width:3, height:NODE_H-1.4, rx:1.5, fill: meta.color }));

      // type label
      const typeTxt = svgEl("text", { x:14, y:17, "font-size":8.5, "font-family":"JetBrains Mono, monospace", "font-weight":600, fill: meta.color, "letter-spacing":"0.12em" });
      typeTxt.textContent = meta.label.toUpperCase();
      g.appendChild(typeTxt);

      // impact dot
      if (n.impact || (n.status && n.status !== "unchanged")) {
        g.appendChild(svgEl("circle", { cx: NODE_W-13, cy:13, r:3.4,
          fill: n.impact ? IMPACT_COLOR[n.impact] : (STATUS_COLOR[n.status]||"var(--border-2)") }));
      }

      // name
      const nameTxt = svgEl("text", { x:14, y:36, "font-size":12, "font-weight":650, "font-family":"Inter, sans-serif", fill:"var(--text-1)" });
      nameTxt.textContent = trunc(n.name, 26); g.appendChild(nameTxt);

      // tech
      const techTxt = svgEl("text", { x:14, y:52, "font-size":9, "font-family":"JetBrains Mono, monospace", fill:"var(--text-3)" });
      techTxt.textContent = trunc(n.tech, 34); g.appendChild(techTxt);

      // description
      const descTxt = svgEl("text", { x:14, y:68, "font-size":9.5, "font-family":"Inter, sans-serif", fill:"var(--text-2)" });
      descTxt.textContent = trunc(n.description, 38); g.appendChild(descTxt);

      // connections
      const connTxt = svgEl("text", { x:NODE_W-8, y:NODE_H-6, "text-anchor":"end", "font-size":8, "font-family":"JetBrains Mono, monospace", fill:"var(--text-3)" });
      connTxt.textContent = `↓${outC} ↑${incC}`; g.appendChild(connTxt);

      g.addEventListener("pointerdown", ev => this._onNodePointerDown(ev, n.id));
      g.addEventListener("dblclick", ev => { ev.stopPropagation(); if (this.editable) { this.sel.clear(); this.sel.add(n.id); this._render(); } });

      this.gNodes.appendChild(g);
    });
  }

  _renderMarquee() {
    this.gMarquee.innerHTML = "";
    if (!this.marquee) return;
    const { x0, y0, x1, y1 } = this.marquee;
    const rx = Math.min(x0,x1), ry = Math.min(y0,y1);
    const rw = Math.abs(x1-x0), rh = Math.abs(y1-y0);
    const r = svgEl("rect", { x:rx, y:ry, width:rw, height:rh, fill:"var(--blue-dim)", stroke:"var(--blue)", "stroke-width":1, "stroke-dasharray":"4 4", rx:2 });
    this.gMarquee.appendChild(r);
  }

  _renderInspector() {
    // remove old
    const old = this.container.querySelector(".ci-inspector");
    if (old) old.remove();
    const oldEdge = this.container.querySelector(".ci-edge-inspector");
    if (oldEdge) oldEdge.remove();
    const oldHint = this.container.querySelector(".ci-click-hint");
    if (oldHint) oldHint.remove();

    const selectedNode = this.sel.size === 1 ? this.nodes.find(n => n.id === [...this.sel][0]) : null;
    const selectedEdge = this.selEdge ? this.edges.find(e => e.id === this.selEdge) : null;

    if (selectedNode) {
      this._buildNodeInspector(selectedNode);
    } else if (selectedEdge && !selectedNode) {
      this._buildEdgeInspector(selectedEdge);
    } else if (!this.connectFrom) {
      const hint = document.createElement("div");
      hint.className = "ci-click-hint";
      hint.style.cssText = "position:absolute;top:10px;right:10px;pointer-events:none;display:flex;align-items:center;gap:6px;opacity:.7;";
      hint.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2"><path d="M4 4l7.5 18 2.5-6 6-2.5z"/></svg><span style="font-family:monospace;font-size:9.5px;color:var(--text-3);">CLICK NODE TO INSPECT</span>`;
      this.container.appendChild(hint);
    }
  }

  _buildNodeInspector(n) {
    const meta = NODE_TYPE_META[n.type] || NODE_TYPE_META.file;
    const incoming = this.edges.filter(e => e.target === n.id);
    const outgoing = this.edges.filter(e => e.source === n.id);

    const div = document.createElement("div");
    div.className = "ci-inspector";

    const hdr = document.createElement("div");
    hdr.className = "ci-inspector-header";
    hdr.innerHTML = `
      <span class="ci-badge" style="color:${meta.color};background:${meta.dim};border-color:color-mix(in srgb,${meta.color} 30%,transparent);">${meta.label}</span>
      <div style="display:flex;align-items:center;gap:4px;">
        <button title="Focus" class="_focus-btn ci-graph-toolbtn" style="width:26px;height:26px;">${crosshairIcon()}</button>
        <button title="Close" class="_close-btn ci-graph-toolbtn" style="width:26px;height:26px;">${xIcon()}</button>
      </div>`;
    div.appendChild(hdr);

    const body = document.createElement("div");
    body.className = "ci-inspector-body";

    const mkField = (lbl, val, editable, onchange, tag="input", rows=2) => {
      const wrap = document.createElement("div");
      const lb = document.createElement("label"); lb.className = "ci-label"; lb.textContent = lbl;
      wrap.appendChild(lb);
      if (editable) {
        const el = document.createElement(tag);
        el.className = tag === "textarea" ? "ci-textarea" : "ci-input";
        el.value = val || "";
        if (tag === "textarea") el.rows = rows;
        el.addEventListener("input", () => onchange(el.value));
        wrap.appendChild(el);
      } else {
        const vd = document.createElement("div");
        vd.style.fontSize = "12.5px"; vd.style.fontWeight = lbl === "Node name" ? "600" : "400";
        vd.textContent = val || "—"; wrap.appendChild(vd);
      }
      return wrap;
    };

    body.appendChild(mkField("Node name", n.name, this.editable, v => this._patchNode(n.id, { name: v })));

    if (this.editable) {
      const tw = document.createElement("div");
      const tl = document.createElement("label"); tl.className = "ci-label"; tl.textContent = "Type";
      const ts = document.createElement("select"); ts.className = "ci-select";
      Object.entries(NODE_TYPE_META).forEach(([k,v]) => {
        const o = document.createElement("option"); o.value = k; o.textContent = v.label;
        if (k === n.type) o.selected = true;
        ts.appendChild(o);
      });
      ts.addEventListener("change", () => this._patchNode(n.id, { type: ts.value }));
      tw.appendChild(tl); tw.appendChild(ts); body.appendChild(tw);
    }

    body.appendChild(mkField("Technology", n.tech, this.editable, v => this._patchNode(n.id, { tech: v })));
    body.appendChild(mkField("Description", n.description, this.editable, v => this._patchNode(n.id, { description: v }), "textarea"));

    if (n.impact) {
      const ip = document.createElement("div");
      ip.style.cssText = "background:var(--panel-2);border:1px solid var(--border);border-radius:5px;padding:10px;";
      const riskColor = n.impact === "high" ? "var(--red)" : n.impact === "medium" ? "var(--amber)" : "var(--blue)";
      ip.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span class="ci-label" style="margin:0;">Component risk</span>
          <span class="ci-badge badge-${n.impact === "high" ? "red" : n.impact === "medium" ? "amber" : "blue"}">${n.impact}</span>
        </div>
        ${n.confidence != null ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span style="color:var(--text-3);">Prediction confidence</span><span style="font-family:monospace;font-weight:600;color:var(--green);">${n.confidence}%</span></div>` : ""}
        ${n.why ? `<p style="font-size:10.5px;line-height:1.6;color:var(--text-2);margin:8px 0 0;">${n.why}</p>` : ""}`;
      body.appendChild(ip);
    }

    // connections list
    const connWrap = document.createElement("div");
    const connLbl = document.createElement("label"); connLbl.className = "ci-label";
    connLbl.textContent = `Connected components (${incoming.length + outgoing.length})`;
    connWrap.appendChild(connLbl);
    const connList = document.createElement("div"); connList.style.display = "flex"; connList.style.flexDirection = "column"; connList.style.gap = "4px";
    [...incoming.map(e => ({dir:"IN", peer: this.nodes.find(x => x.id === e.source)})),
     ...outgoing.map(e => ({dir:"OUT", peer: this.nodes.find(x => x.id === e.target)}))
    ].forEach(({dir, peer}) => {
      if (!peer) return;
      const b = document.createElement("button");
      b.style.cssText = "width:100%;display:flex;align-items:center;gap:8px;text-align:left;padding:4px 8px;border-radius:4px;background:var(--panel-2);border:1px solid var(--border);cursor:pointer;font-family:inherit;font-size:11px;color:var(--text-2);";
      b.innerHTML = `<span style="font-family:monospace;font-size:9px;color:var(--text-3);">${dir}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${peer.name}</span>`;
      b.addEventListener("click", () => { this.sel.clear(); this.sel.add(peer.id); this._render(); this._renderInspector(); });
      connList.appendChild(b);
    });
    if (!incoming.length && !outgoing.length) { const nd = document.createElement("div"); nd.style.cssText = "font-size:11px;color:var(--text-3);"; nd.textContent = "No connections."; connList.appendChild(nd); }
    connWrap.appendChild(connList); body.appendChild(connWrap);

    if (this.editable) {
      const actRow = document.createElement("div");
      actRow.style.cssText = "display:flex;gap:6px;padding-top:4px;";
      const connBtn = document.createElement("button"); connBtn.className = "ci-btn"; connBtn.style.flex = "1"; connBtn.style.justifyContent = "center";
      connBtn.innerHTML = `${linkIcon()} Connect`;
      connBtn.addEventListener("click", () => { this.connectFrom = n.id; this.svg.style.cursor = "crosshair"; div.remove(); });
      const delBtn = document.createElement("button"); delBtn.className = "ci-btn ci-btn-danger"; delBtn.style.flex = "1"; delBtn.style.justifyContent = "center";
      delBtn.innerHTML = `${trashIcon()} Delete`;
      delBtn.addEventListener("click", () => { this._deleteNode(n.id); div.remove(); });
      actRow.appendChild(connBtn); actRow.appendChild(delBtn); body.appendChild(actRow);
    }

    div.appendChild(body);
    div.querySelector("._close-btn").addEventListener("click", () => { this.sel.clear(); this._render(); div.remove(); });
    div.querySelector("._focus-btn").addEventListener("click", () => this._focusOn(n.id));
    this.container.appendChild(div);
  }

  _buildEdgeInspector(e) {
    const src = this.nodes.find(n => n.id === e.source);
    const tgt = this.nodes.find(n => n.id === e.target);
    const div = document.createElement("div");
    div.className = "ci-edge-inspector ci-inspector";
    div.innerHTML = `
      <div class="ci-inspector-header">
        <span style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);">Connection</span>
        <button class="_close-btn ci-graph-toolbtn" style="width:26px;height:26px;">${xIcon()}</button>
      </div>
      <div class="ci-inspector-body">
        <div style="font-family:monospace;font-size:11px;line-height:1.6;">
          <span style="color:var(--blue);">${src?.name||"?"}</span>
          <span style="color:var(--text-3);"> → </span>
          <span style="color:var(--teal);">${tgt?.name||"?"}</span>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text-2);cursor:pointer;">
          <input type="checkbox" ${e.indirect?"checked":""} ${!this.editable?"disabled":""}> Indirect / inferred dependency
        </label>
        ${this.editable ? `<button class="_del-edge ci-btn ci-btn-danger" style="width:100%;justify-content:center;">${trashIcon()} Delete connection</button>` : ""}
      </div>`;
    div.querySelector("._close-btn").addEventListener("click", () => { this.selEdge = null; this._render(); div.remove(); });
    const cb = div.querySelector("input[type=checkbox]");
    if (cb) cb.addEventListener("change", () => { const idx = this.edges.findIndex(x => x.id === e.id); if (idx > -1) this.edges[idx].indirect = cb.checked; this._render(); });
    const delBtn = div.querySelector("._del-edge");
    if (delBtn) delBtn.addEventListener("click", () => { this.edges = this.edges.filter(x => x.id !== e.id); this.selEdge = null; this._render(); div.remove(); });
    this.container.appendChild(div);
  }

  /* ── interactions ──────────────────────────────────────────────── */
  _attachSvgPointer() {
    this.svg.addEventListener("pointerdown", e => this._onSvgPointerDown(e));
    this.svg.addEventListener("pointermove", e => this._onSvgPointerMove(e));
    this.svg.addEventListener("pointerup",   e => this._onSvgPointerUp(e));
    this.svg.addEventListener("dblclick",    () => { this.focusId = null; this.sel.clear(); this.selEdge = null; this._render(); this._renderInspector(); });
  }

  _pt(e) {
    const rect = this.svg.getBoundingClientRect();
    const v = this.view;
    return { x: (e.clientX - rect.left - v.x) / v.k, y: (e.clientY - rect.top - v.y) / v.k };
  }

  _onSvgPointerDown(e) {
    if (e.button !== 0) return;
    this.svg.setPointerCapture(e.pointerId);
    const d = this._drag;
    d.sx = e.clientX; d.sy = e.clientY; d.vx = this.view.x; d.vy = this.view.y;
    d.moved = false; d.shift = e.shiftKey; d.downId = null;
    if (e.shiftKey) {
      d.mode = "marquee";
      const w = this._pt(e);
      this.marquee = { x0: w.x, y0: w.y, x1: w.x, y1: w.y };
    } else {
      d.mode = "pan";
      if (!e.shiftKey) { this.sel.clear(); this.selEdge = null; this._render(); this._renderInspector(); }
    }
  }

  _onNodePointerDown(e, id) {
    if (e.button !== 0) return;
    e.stopPropagation();
    this.svg.setPointerCapture(e.pointerId);
    if (this.connectFrom) {
      if (this.connectFrom !== id) {
        this.edges.push({ id: nextId("e"), source: this.connectFrom, target: id });
      }
      this.connectFrom = null;
      this.svg.style.cursor = "grab";
      this._render(); this._renderInspector();
      return;
    }
    const d = this._drag;
    d.sx = e.clientX; d.sy = e.clientY; d.moved = false;
    d.shift = e.shiftKey; d.downId = id; d.shiftToggled = false;
    if (e.shiftKey) {
      if (this.sel.has(id)) this.sel.delete(id); else this.sel.add(id);
      d.shiftToggled = true;
      this._render(); this._renderInspector();
      return;
    }
    let targets;
    if (this.sel.has(id)) { targets = new Set(this.sel); }
    else { targets = new Set([id]); this.sel = targets; this.selEdge = null; }
    d.mode = "nodes";
    d.start = new Map(this.nodes.filter(n => targets.has(n.id)).map(n => [n.id, { x: n.x, y: n.y }]));
    this._render(); this._renderInspector();
  }

  _onSvgPointerMove(e) {
    const d = this._drag;
    if (d.mode === "pan" && e.buttons) {
      if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 2) d.moved = true;
      this.view = { ...this.view, x: d.vx + (e.clientX - d.sx), y: d.vy + (e.clientY - d.sy) };
      this._applyTransform();
    } else if (d.mode === "nodes" && d.downId && e.buttons) {
      const dx = (e.clientX - d.sx) / this.view.k;
      const dy = (e.clientY - d.sy) / this.view.k;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.moved) {
        this.nodes.forEach(n => {
          const s = d.start.get(n.id);
          if (s) { n.x = s.x + dx; n.y = s.y + dy; }
        });
        this._render();
      }
    } else if (d.mode === "marquee" && this.marquee) {
      const w = this._pt(e);
      this.marquee = { ...this.marquee, x1: w.x, y1: w.y };
      this._renderMarquee();
    }
  }

  _onSvgPointerUp(e) {
    const d = this._drag;
    if (d.mode === "marquee" && this.marquee) {
      const { x0, y0, x1, y1 } = this.marquee;
      const rx0 = Math.min(x0,x1), rx1 = Math.max(x0,x1);
      const ry0 = Math.min(y0,y1), ry1 = Math.max(y0,y1);
      const inside = this.nodes.filter(n => n.x - NODE_W/2 < rx1 && n.x + NODE_W/2 > rx0 && n.y < ry1 && n.y + NODE_H > ry0);
      this.sel = new Set(inside.map(n => n.id));
      this.marquee = null;
      this._render(); this._renderInspector();
    }
    if (d.mode === "nodes" && !d.moved && d.downId && !d.shift && !this.connectFrom) {
      this.sel = new Set([d.downId]); this.selEdge = null;
      this._render(); this._renderInspector();
    }
    d.mode = "pan"; d.downId = null; d.start = new Map();
  }

  _attachWheel() {
    const el = this.svg;
    el.addEventListener("wheel", e => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const k2 = clamp(this.view.k * Math.exp(-e.deltaY * 0.0014), 0.18, 2.8);
      const wx = (mx - this.view.x) / this.view.k, wy = (my - this.view.y) / this.view.k;
      this.view = { x: mx - wx*k2, y: my - wy*k2, k: k2 };
      this._render();
    }, { passive: false });
  }

  _attachKeyboard() {
    this.container.addEventListener("keydown", e => {
      if (e.key === "Escape") { this.connectFrom = null; this.focusId = null; this.sel.clear(); this.selEdge = null; this.svg.style.cursor = "grab"; this._render(); this._renderInspector(); }
      if ((e.key === "Delete" || e.key === "Backspace") && this.editable) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (this.selEdge) { this.edges = this.edges.filter(x => x.id !== this.selEdge); this.selEdge = null; }
        else if (this.sel.size) { this._deleteSelection(); }
        this._render(); this._renderInspector();
      }
    });
  }

  /* ── operations ────────────────────────────────────────────────── */
  _patchNode(id, patch) {
    const n = this.nodes.find(x => x.id === id);
    if (n) Object.assign(n, patch);
    this._render();
  }

  _deleteNode(id) {
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.sel.delete(id); this.focusId = null;
    this._render(); this._renderInspector();
  }

  _deleteSelection() {
    this.edges = this.edges.filter(e => !this.sel.has(e.source) && !this.sel.has(e.target));
    this.nodes = this.nodes.filter(n => !this.sel.has(n.id));
    this.sel.clear(); this.focusId = null;
    this._render(); this._renderInspector();
  }

  _focusSelected() {
    if (this.sel.size === 1) this._focusOn([...this.sel][0]);
  }

  _focusOn(id) {
    const n = this.nodes.find(x => x.id === id);
    if (!n) return;
    const k = clamp(this.view.k, 0.6, 1.15);
    const cw = this.container.clientWidth, ch = this.container.clientHeight;
    this.view = { x: cw/2 - (n.x + NODE_W/2)*k, y: ch/2 - (n.y + NODE_H/2)*k, k };
    this.focusId = id;
    this._render();
  }

  fitView(pad = 80, list) {
    const el = this.container;
    const ns = list ?? this.nodes;
    if (!ns.length) return;
    const minX = Math.min(...ns.map(n => n.x)) - NODE_W/2;
    const maxX = Math.max(...ns.map(n => n.x)) + NODE_W/2;
    const minY = Math.min(...ns.map(n => n.y)) - 10;
    const maxY = Math.max(...ns.map(n => n.y)) + NODE_H + 10;
    const cw = el.clientWidth, ch = el.clientHeight;
    const k = clamp(Math.min((cw - pad*2)/(maxX-minX), (ch - pad*2)/(maxY-minY)), 0.2, 1.2);
    this.view = { x: (cw - (maxX-minX)*k)/2 - minX*k, y: (ch - (maxY-minY)*k)/2 - minY*k, k };
    this._render();
  }

  zoomBy(f) {
    const el = this.container;
    const k2 = clamp(this.view.k * f, 0.18, 2.8);
    const mx = el.clientWidth/2, my = el.clientHeight/2;
    const wx = (mx - this.view.x)/this.view.k, wy = (my - this.view.y)/this.view.k;
    this.view = { x: mx - wx*k2, y: my - wy*k2, k: k2 };
    this._render();
  }

  autoLayout() {
    const incoming = new Map();
    this.nodes.forEach(n => incoming.set(n.id, []));
    this.edges.forEach(e => { if (incoming.has(e.target) && incoming.has(e.source)) incoming.get(e.target).push(e.source); });
    const layer = new Map();
    const layerOf = (id, guard) => {
      if (layer.has(id)) return layer.get(id);
      if (guard.has(id)) return 0;
      guard.add(id);
      const preds = incoming.get(id) || [];
      const l = preds.length ? Math.max(...preds.map(p => layerOf(p, guard))) + 1 : 0;
      guard.delete(id); layer.set(id, l); return l;
    };
    this.nodes.forEach(n => layerOf(n.id, new Set()));
    const groups = new Map();
    this.nodes.forEach(n => { const l = layer.get(n.id)||0; if (!groups.has(l)) groups.set(l,[]); groups.get(l).push(n); });
    const xs = new Map();
    [...groups.keys()].sort((a,b) => a-b).forEach(l => {
      const g = groups.get(l);
      g.sort((a,b) => {
        const ba = (incoming.get(a.id)||[]).reduce((s,p) => s+(xs.get(p)||0), 0) / Math.max(1,(incoming.get(a.id)||[]).length);
        const bb = (incoming.get(b.id)||[]).reduce((s,p) => s+(xs.get(p)||0), 0) / Math.max(1,(incoming.get(b.id)||[]).length);
        return ba - bb;
      });
      g.forEach((n,i) => {
        n.x = (i - (g.length-1)/2) * (NODE_W + 64);
        n.y = l * (NODE_H + 86);
        xs.set(n.id, n.x);
      });
    });
    requestAnimationFrame(() => this.fitView(80));
    this._render();
  }

  reset() {
    this.nodes = this.origData.nodes.map(n => ({...n}));
    this.edges = this.origData.edges.map(e => ({...e}));
    this.sel.clear(); this.selEdge = null; this.focusId = null; this.connectFrom = null;
    this._render(); this._renderInspector();
    requestAnimationFrame(() => this.fitView(80));
  }

  _exportSvg() {
    const clone = this.svg.cloneNode(true);
    const rect = this.container.getBoundingClientRect();
    clone.setAttribute("width", rect.width);
    clone.setAttribute("height", rect.height);
    clone.setAttribute("xmlns", SVG_NS);
    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = `:root{--bg-0:#050607;--panel:#0c0f14;--panel-2:#10141b;--panel-3:#141923;--border:#1c2430;--border-2:#2a3442;--text-1:#f4f7fb;--text-2:#a8b3c4;--text-3:#647184;--blue:#6ea8fe;--green:#4cb782;--amber:#d6a34a;--red:#e05252;--violet:#9aa6ff;--teal:#a7f3d0;--graph-line:#334155;}`;
    clone.insertBefore(style, clone.firstChild);
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `change-impact-${this.graphKey}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _openAddDialog() {
    const overlay = document.createElement("div");
    overlay.className = "ci-dialog-overlay";
    overlay.addEventListener("pointerdown", () => overlay.remove());

    const typeOpts = Object.entries(NODE_TYPE_META).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join("");
    const nodeOpts = this.nodes.map(n => `<option value="${n.id}">${n.name}</option>`).join("");

    overlay.innerHTML = `
      <div class="ci-dialog" style="pointer-events:auto;">
        <div class="ci-dialog-header">
          <span style="font-size:12.5px;font-weight:600;">Add node</span>
          <span style="font-family:monospace;font-size:9.5px;color:var(--text-3);">ARCHITECTURE OBJECT</span>
        </div>
        <div class="ci-dialog-body">
          <div><label class="ci-label">Node name</label><input class="_name ci-input" placeholder="e.g. OAuth Callback API" autofocus></div>
          <div><label class="ci-label">Node type</label><select class="_type ci-select">${typeOpts}</select></div>
          <div><label class="ci-label">Technology</label><input class="_tech ci-input mono" placeholder="e.g. Flask route · services/oauth.py"></div>
          <div><label class="ci-label">Description</label><textarea class="_desc ci-textarea" rows="2" placeholder="What does this component do?"></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 52px;gap:6px;">
            <div><label class="ci-label">Connect to existing (optional)</label><select class="_link ci-select"><option value="">None</option>${nodeOpts}</select></div>
            <div><label class="ci-label">Edge</label><select class="_dir ci-select"><option value="to">→ it</option><option value="from">it →</option></select></div>
          </div>
        </div>
        <div class="ci-dialog-footer">
          <button class="_cancel ci-btn ci-btn-ghost">Cancel</button>
          <button class="_add ci-btn ci-btn-primary">${plusIcon()} Add node</button>
        </div>
      </div>`;

    overlay.querySelector(".ci-dialog").addEventListener("pointerdown", e => e.stopPropagation());
    overlay.querySelector("._cancel").addEventListener("click", () => overlay.remove());
    overlay.querySelector("._add").addEventListener("click", () => {
      const name = overlay.querySelector("._name").value.trim();
      if (!name) return;
      const type = overlay.querySelector("._type").value;
      const tech = overlay.querySelector("._tech").value.trim();
      const desc = overlay.querySelector("._desc").value.trim();
      const link = overlay.querySelector("._link").value;
      const dir  = overlay.querySelector("._dir").value;
      const cw = this.container.clientWidth, ch = this.container.clientHeight;
      const spawnX = (cw/2 - this.view.x) / this.view.k;
      const spawnY = (ch/2 - this.view.y) / this.view.k;
      const id = nextId("n");
      const node = { id, name, type, tech: tech||undefined, description: desc||undefined, x: spawnX - 104 + (Math.random()*90-45), y: spawnY - 41 + (Math.random()*70-35) };
      this.nodes.push(node);
      if (link) this.edges.push({ id: nextId("e"), source: dir === "from" ? id : link, target: dir === "from" ? link : id });
      this.sel = new Set([id]);
      overlay.remove();
      this._render(); this._renderInspector();
    });

    this.container.appendChild(overlay);
    setTimeout(() => overlay.querySelector("._name").focus(), 50);
  }

  _fitLater() {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 80 && height > 80) { this.fitView(80); ro.disconnect(); break; }
      }
    });
    ro.observe(this.container);
    setTimeout(() => this.fitView(80), 100);
  }

  _updateStatusBar() {
    if (this._statusBar) {
      this._statusBar.innerHTML = `<span>${this.nodes.length} NODES · ${this.edges.length} EDGES · ${Math.round(this.view.k*100)}%</span><span class="lg\\:inline" style="display:none;">SCROLL ZOOM · DRAG PAN · SHIFT+DRAG MULTI-SELECT · DBL-CLICK CLEAR</span>`;
    }
  }

  _updateToolbarState() {
    if (this._pathsBtn) { this._pathsBtn.classList.toggle("active", this.showPaths); }
    if (this._focusBtn) { this._focusBtn.disabled = this.sel.size !== 1; }
    if (this._delBtn)   { this._delBtn.disabled = this.sel.size === 0 && !this.selEdge; }
    if (this._searchCount) { const m = this._matches(); this._searchCount.textContent = m ? String(m.size) : ""; }
  }

  setData(data) {
    this.nodes = data.nodes.map(n => ({...n}));
    this.edges = data.edges.map(e => ({...e}));
    this.origData = data;
    this.sel.clear(); this.selEdge = null; this.focusId = null; this.connectFrom = null;
    this._render(); this._renderInspector();
    requestAnimationFrame(() => this.fitView(80, data.nodes));
  }

  setFilter(f) { this.filterProp = f; this._render(); }
}

/* ── SVG icon helpers ── */
function plusIcon() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`; }
function trashIcon() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`; }
function downloadIcon() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`; }
function fitIcon()   { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`; }
function layoutIcon(){ return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`; }
function resetIcon() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>`; }
function zoomOutIcon(){return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;}
function zoomInIcon() {return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;}
function crosshairIcon(){return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`;}
function pathIcon()  {return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="3" cy="12" r="2"/><circle cx="21" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><path d="M5 12h6M15 12h4M12 7v10"/></svg>`;}
function linkIcon()  {return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;}
function xIcon()     {return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;}

window.GraphCanvas = GraphCanvas;
