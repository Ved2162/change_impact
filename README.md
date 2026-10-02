# ChangeImpact — Analysis Workspace

> Understand the full impact of a code change **before** you implement it.

ChangeImpact reconstructs your project as a living architecture map — files, functions, APIs, dependencies, environment variables — then lets you simulate a proposed change and instantly see what breaks, what's at risk, and how confident the prediction is.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Graph-first analysis** | Project reconstructed as an interactive dependency graph — explorable, filterable, editable |
| **Change simulation** | Describe a change in plain language; CI projects it onto the current flow without touching code |
| **Blast radius scoring** | Evidence-backed risk score, blast radius, and confidence percentage per simulation |
| **Before / After comparison** | Side-by-side architecture diff between current and proposed state |
| **Impact report** | Full engineering report covering files, functions, APIs, DB, deps, env, security and tests |
| **GitHub integration** | Compare branches / PRs, run impact analysis on the diff |
| **Security analysis** | Automatic security findings tied to each project and change |
| **What-If simulation** | Animate the proposed flow interactively before committing |
| **Admin Panel** | Superuser-only master control panel — manage users, projects and analyses |
| **Entry splash loader** | Branded logo loader on every page load with smooth crossfade reveal |
| **Auth transitions** | Premium logo-centered animated transitions between login/signup and the workspace |
| **Responsive design** | Full mobile/tablet/desktop layout (640 → 1280 px breakpoints) |
| **Dark / Light theme** | System-aware theme toggle persisted in `localStorage` |

---

## 🛠 Tech Stack

- **Backend** — Python 3.12 · Django 4.2
- **Database** — SQLite (dev) — swap `DATABASES` in `settings.py` for PostgreSQL/MySQL in production
- **Frontend** — Vanilla HTML/CSS/JS (no framework, no Tailwind, plain CSS design system)
- **Fonts** — Inter · JetBrains Mono (Google Fonts)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ved2162/change_impact.git
cd change_impact
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Apply migrations

```bash
python manage.py migrate
```

### 5. Create a superuser (admin account)

```bash
python manage.py createsuperuser
```

> The superuser account has exclusive access to the **Admin Panel** at `/admin-panel/`.
> Regular users see the full workspace; the admin account sees only the Admin Panel.

### 6. Run the development server

```bash
python manage.py runserver
```

Open **http://127.0.0.1:8000/** in your browser.

---

## 🗂 Project Structure

```
change_impact_django/
├── change_impact/          # Django project config (settings, urls, wsgi)
├── core/                   # Main application
│   ├── models.py           # Project, ChangeAnalysis, GraphNode, GraphEdge, ...
│   ├── views.py            # All page + API views
│   ├── urls.py             # URL routing
│   ├── admin.py            # Django admin registrations
│   ├── demo_data.py        # Static demo data (graphs, analyses, diffs)
│   └── templatetags/
│       └── ci_tags.py      # Custom template tags (nav icons, badges, meters)
├── templates/
│   ├── base.html           # Main layout (sidebar + topbar) — workspace
│   ├── base_home.html      # Standalone full-page layout (home page)
│   ├── auth/               # Login · Signup
│   ├── partials/           # meter · score_ring
│   └── views/              # One template per page + admin_panel.html
├── static/
│   ├── css/main.css        # Full design system (no Tailwind)
│   └── js/
│       ├── app.js          # Sidebar, theme, topbar, nav active state
│       ├── graph.js        # Interactive graph canvas (drag, zoom, connect)
│       ├── agent.js        # Impact Agent FAB + chat panel
│       ├── palette.js      # Command palette (⌘K)
│       ├── home.js         # Home page animations
│       └── auth_transitions.js  # Auth page transitions + entry splash loader
├── requirements.txt
├── manage.py
└── README.md
```

---

## 🔑 Access Levels

| Account type | Landing page | Sidebar | Access |
|---|---|---|---|
| **Regular user** | `/` (Home) | Full workspace nav | All workspace pages |
| **Superuser (admin)** | `/admin-panel/` | Admin Panel only | Admin Panel only — all other routes redirect back |

---

## 📄 Pages

| URL | Page |
|---|---|
| `/` | Home |
| `/add-project/` | Add Project |
| `/analysis/` | Project Analysis |
| `/overview/` | Overview |
| `/current-flow/` | Current Flow |
| `/project-insights/` | Project Insights |
| `/dependencies/` | Dependencies |
| `/security/` | Security |
| `/environment/` | Environment Variables |
| `/analyze-change/` | Analyze Change |
| `/what-if/` | What-If Simulation |
| `/impact-graph/` | Impact Graph |
| `/impact-analysis/` | Impact Analysis |
| `/change-impact-report/` | Change Impact Report |
| `/before-after/` | Before vs After |
| `/github/` | GitHub Integration |
| `/reports/` | Reports |
| `/history/` | History |
| `/settings/` | Settings |
| `/admin-panel/` | **Admin Panel** *(superuser only)* |
| `/login/` | Login |
| `/signup/` | Sign Up |

---

## 🎨 Design System

All styles live in `static/css/main.css` — a hand-crafted design system that mirrors the Tailwind utility class API but ships as plain CSS:

- CSS custom properties for both **dark** and **light** themes
- Layout primitives (flex, grid, spacing, sizing)
- Component classes: `ci-btn`, `ci-panel`, `ci-badge`, `ci-stat`, `ci-tab`, `ci-input`, `ci-chip`, …
- Animated entry-splash loader with `ci-entry-loading` / `ci-entry-exiting` lifecycle
- Auth page transitions via `ci-auth-entrance` / `ci-auth-exit-active`
- Full responsive breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280

---

## ⚙️ Configuration

Key settings in `change_impact/settings.py`:

| Setting | Default | Notes |
|---|---|---|
| `DEBUG` | `True` | Set to `False` in production |
| `SECRET_KEY` | dev key | **Replace** with a secure random key in production |
| `DATABASES` | SQLite | Replace with PostgreSQL/MySQL config for production |
| `ALLOWED_HOSTS` | `['*']` | Restrict to your domain(s) in production |
| `STATIC_ROOT` | `staticfiles/` | Run `collectstatic` before deploying |

---

## 📦 Requirements

```
Django>=4.2,<5.0
```

See `requirements.txt` for the full pinned list.

---

## 📝 License

MIT — see `LICENSE` for details.
