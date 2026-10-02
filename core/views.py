import json
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST

from . import demo_data as D


# ─── helpers ─────────────────────────────────────────────────────────────────

def _ctx(request=None, **kwargs):
    """Merge common project context with view-specific kwargs."""
    is_superuser = request.user.is_superuser if (request and request.user.is_authenticated) else False
    base = {
        "project": D.PROJECT,
        "nav_groups": _nav_groups(is_superuser=is_superuser),
        "is_superuser": is_superuser,
    }
    base.update(kwargs)
    return base


def _nav_groups(is_superuser=False):
    # Superuser sees ONLY the Admin Panel — no workspace nav at all
    if is_superuser:
        return [
            {
                "group": "Admin",
                "items": [
                    {"id": "admin-panel", "label": "Admin Panel", "icon": "admin-panel"},
                ],
            }
        ]
    return [
        {"group": "Workspace", "items": [
            {"id": "home",             "label": "Home",            "icon": "Home"},
            {"id": "analysis",         "label": "Project Analysis","icon": "ScanSearch"},
            {"id": "project-insights", "label": "Project Insights","icon": "LayoutDashboard"},
        ]},
        {"group": "Change", "items": [
            {"id": "analyze-change",  "label": "Analyze Change",     "icon": "PenLine"},
            {"id": "what-if",         "label": "What-If Simulation", "icon": "FlaskConical"},
            {"id": "impact-graph",    "label": "Impact Graph",       "icon": "Network"},
            {"id": "impact-analysis", "label": "Impact Analysis",    "icon": "Gauge"},
        ]},
        {"group": "System", "items": [
            {"id": "github",   "label": "GitHub",  "icon": "FolderGit2"},
            {"id": "reports",  "label": "Reports", "icon": "FileText"},
            {"id": "history",  "label": "History", "icon": "History"},
            {"id": "settings", "label": "Settings","icon": "Settings"},
        ]},
    ]


# ─── auth ─────────────────────────────────────────────────────────────────────

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            # Superuser always lands on the admin panel
            if user.is_superuser:
                return redirect("/admin-panel/")
            return redirect("/")
        return render(request, "auth/login.html", {"error": "Invalid credentials."})
    return render(request, "auth/login.html")


def signup_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        email = request.POST.get("email", "")
        if User.objects.filter(username=username).exists():
            return render(request, "auth/signup.html", {"error": "Username already taken."})
        user = User.objects.create_user(username=username, password=password, email=email)
        login(request, user)
        return redirect("/")
    return render(request, "auth/signup.html")


def _superuser_guard(request):
    """Return a redirect if a superuser tries to access a normal workspace page."""
    if request.user.is_authenticated and request.user.is_superuser:
        return redirect("/admin-panel/")
    return None


def logout_view(request):
    if request.method == "POST":
        logout(request)
    return redirect("/login/")


# ─── main pages ───────────────────────────────────────────────────────────────

def home(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/home.html", _ctx(request=request, 
        view="home",
        home_code_rows=[
            "scan.project('ecommerce-backend')",
            "flow = map_dependencies(files=126)",
            "change = simulate('Add Google Login')",
            "risk = impact.score(flow, change)",
            "report.emit(blast_radius=18, confidence=91)",
        ],
        flow_steps=["PROJECT","UNDERSTAND","CURRENT FLOW","PROPOSE CHANGE","SIMULATE","IMPACT FLOW","MEASURE","COMPARE","REPORT"],
        feature_cards=[
            {"key":"01","title":"Graph-first analysis","color":"var(--blue)","desc":"Your project is reconstructed as a living architecture map — files, functions, APIs, dependencies and environment — fully explorable and editable."},
            {"key":"02","title":"Simulate before you ship","color":"var(--amber)","desc":"Describe a change in plain language. Change Impact projects it onto the current flow and animates the new relationships — without touching your code."},
            {"key":"03","title":"Measure the blast radius","color":"var(--green)","desc":"Every simulation resolves to evidence-backed risk, blast-radius and confidence scores, then compiles into an engineering report."},
        ],
    ))


def add_project(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/add_project.html", _ctx(request=request, 
        view="add-project",
        mock_repos=[
            {"name": "ecommerce-backend", "lang": "Python · Flask",        "size": "126 files"},
            {"name": "portfolio-api",     "lang": "TypeScript · Fastify",  "size": "54 files"},
            {"name": "payment-service",   "lang": "Python · Django",       "size": "88 files"},
        ],
        pipeline_steps=["SCAN FILES", "MAP FUNCTIONS", "TRACE APIS", "RESOLVE DEPENDENCIES", "BUILD CURRENT FLOW"],
    ))


def analysis(request):
    guard = _superuser_guard(request)
    if guard: return guard
    import json
    steps = [
        {"label": "Scanning files",                "result": "126 files · Python 3.12 · Flask detected"},
        {"label": "Analyzing functions",           "result": "341 functions · 58 classes"},
        {"label": "Mapping APIs",                  "result": "42 endpoints · 9 blueprints"},
        {"label": "Analyzing dependencies",        "result": "34 packages · 3 advisories"},
        {"label": "Checking environment variables","result": "11 variables · 1 missing optional"},
        {"label": "Running security analysis",     "result": "15 findings · 2 high severity"},
        {"label": "Building project relationships","result": "518 edges resolved"},
        {"label": "Generating current flow",       "result": "architecture map ready"},
    ]
    return render(request, "views/analysis.html", _ctx(request=request, 
        view="analysis",
        steps=steps,
        steps_json=json.dumps(steps),
    ))


def overview(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/overview.html", _ctx(request=request, 
        view="overview",
        history=D.HISTORY[:3],
        stack_tags=["Python 3.12", "Flask 3.1.0", "SQLAlchemy 2.0.41", "PostgreSQL 15", "Redis 7", "Celery 5.3", "pytest"],
    ))


def current_flow(request):
    guard = _superuser_guard(request)
    if guard: return guard
    type_pills = [
        {"label":"5 APIs",        "color":"var(--blue)",   "icon":'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'},
        {"label":"3 Functions",   "color":"var(--green)",  "icon":'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'},
        {"label":"1 Database",    "color":"var(--amber)",  "icon":'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'},
        {"label":"3 Dependencies","color":"var(--amber)",  "icon":'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'},
        {"label":"2 Env",         "color":"var(--teal)",   "icon":'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>'},
        {"label":"2 Tests",       "color":"var(--green)",  "icon":'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>'},
    ]
    return render(request, "views/current_flow.html", _ctx(request=request, 
        view="current-flow",
        graph_data_json=json.dumps(D.CURRENT_FLOW),
        type_pills=type_pills,
    ))


def project_insights(request):
    guard = _superuser_guard(request)
    if guard: return guard
    tab = request.GET.get("tab", "dependencies")
    return render(request, "views/project_insights.html", _ctx(request=request, 
        view="project-insights",
        tab=tab,
        dependencies=D.DEPENDENCIES,
        env_vars=D.ENV_VARS,
        security=D.SECURITY,
    ))


def dependencies(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/dependencies.html", _ctx(request=request, 
        view="dependencies",
        dependencies=D.DEPENDENCIES,
    ))


def security(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/security.html", _ctx(request=request, 
        view="security",
        security=D.SECURITY,
    ))


def environment(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/environment.html", _ctx(request=request, 
        view="environment",
        env_vars=D.ENV_VARS,
    ))


def analyze_change(request):
    guard = _superuser_guard(request)
    if guard: return guard
    change = request.GET.get("change", D.PROJECT["change"])
    return render(request, "views/analyze_change.html", _ctx(request=request, 
        view="analyze-change",
        initial_change=change,
        enhance_questions=D.ENHANCE_QUESTIONS,
        enhanced_spec=D.PROJECT["enhancedSpec"],
        spec_meta=[
            {"k": "PROVIDERS",    "v": "2 (Email + Google)"},
            {"k": "TOKEN SYSTEM", "v": "JWT RS256 (unchanged)"},
            {"k": "NEW ENV VARS", "v": "2 required"},
        ],
    ))


def what_if(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/what_if.html", _ctx(request=request, 
        view="what-if",
        sim_current_json=json.dumps(D.SIM_CURRENT),
        sim_proposed_json=json.dumps(D.SIM_PROPOSED),
    ))


def impact_analysis(request):
    guard = _superuser_guard(request)
    if guard: return guard
    icon = lambda c, p: f'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2"><{p}/></svg>'
    impact_stats = [
        {"label":"Files Affected",    "value":D.PROJECT["impact"]["files"],       "color":"var(--amber)", "icon":icon("var(--amber)","path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"")},
        {"label":"Functions",         "value":D.PROJECT["impact"]["functions"],   "color":"var(--amber)", "icon":icon("var(--amber)","line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"")},
        {"label":"APIs",              "value":D.PROJECT["impact"]["apis"],        "color":"var(--blue)",  "icon":icon("var(--blue)","circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"")},
        {"label":"DB Components",     "value":D.PROJECT["impact"]["db"],          "color":"var(--amber)", "icon":icon("var(--amber)","ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M21 12c0 1.66-4 3-9 3s-9-1.34-9-3\"/><path d=\"M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5\"")},
        {"label":"Dependencies",      "value":D.PROJECT["impact"]["dependencies"],"color":"var(--teal)",  "icon":icon("var(--teal)","path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"")},
        {"label":"Env Variables",     "value":D.PROJECT["impact"]["env"],         "color":"var(--teal)",  "icon":icon("var(--teal)","path d=\"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4\"")},
        {"label":"Security Concerns", "value":D.PROJECT["impact"]["security"],    "color":"var(--red)",   "icon":icon("var(--red)","path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"")},
        {"label":"Tests",             "value":D.PROJECT["impact"]["tests"],       "color":"var(--blue)",  "icon":icon("var(--blue)","path d=\"M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18\"")},
    ]
    return render(request, "views/impact_analysis.html", _ctx(request=request, 
        view="impact-analysis",
        impact_flow_json=json.dumps(D.IMPACT_FLOW),
        risk_factors=D.RISK_FACTORS,
        security_impact=D.SECURITY_IMPACT,
        test_impact=D.TEST_IMPACT,
        impact_stats=impact_stats,
        blast_mini=[{"l":"FILES","v":14},{"l":"FUNCTIONS","v":27},{"l":"APIS","v":8}],
    ))


def impact_graph(request):
    guard = _superuser_guard(request)
    if guard: return guard
    tab = request.GET.get("tab", "current")
    filters = [
        {"id":"all","label":"ALL"},{"id":"file","label":"FILES"},{"id":"function","label":"FUNCTIONS"},
        {"id":"api","label":"APIS"},{"id":"database","label":"DATABASE"},
        {"id":"dependency","label":"DEPENDENCIES"},{"id":"security","label":"SECURITY"},{"id":"test","label":"TESTS"},
    ]
    return render(request, "views/impact_graph.html", _ctx(request=request, 
        view="impact-graph",
        initial_tab=tab,
        current_flow_json=json.dumps(D.CURRENT_FLOW),
        impact_flow_json=json.dumps(D.IMPACT_FLOW),
        before_graph_json=json.dumps(D.BEFORE_GRAPH),
        after_graph_json=json.dumps(D.AFTER_GRAPH),
        filters=filters,
    ))


def change_impact_report(request):
    guard = _superuser_guard(request)
    if guard: return guard
    change = request.GET.get("change", D.PROJECT["change"])
    api_nodes = [n for n in D.IMPACT_FLOW["nodes"] if n["type"] == "api"]
    new_deps = [d for d in D.DEP_COMPARE if d["status"] == "Added"]
    updated_deps = [d for d in D.DEP_COMPARE if d["status"] == "Version Change"]
    removed_deps = [d for d in D.DEP_COMPARE if d["status"] == "Removed"]
    return render(request, "views/change_impact_report.html", _ctx(request=request, 
        view="change-impact-report",
        change=change,
        api_nodes=api_nodes,
        new_deps=new_deps,
        updated_deps=updated_deps,
        removed_deps=removed_deps,
        security_impact=D.SECURITY_IMPACT,
        risk_factors=D.RISK_FACTORS,
        dep_compare=D.DEP_COMPARE,
        impact_flow=D.IMPACT_FLOW,
        env_vars_impact=[
            {"name": "GOOGLE_CLIENT_ID",     "desc": "Identifies the registered OAuth client without embedding credentials in code."},
            {"name": "GOOGLE_CLIENT_SECRET", "desc": "Provides the server-side OAuth client credential; keep it in protected environment configuration and rotate it."},
        ],
        db_impact=[
            {"title": "PostgreSQL",        "tag": "PostgreSQL 15", "detail": "The user identity model needs provider linkage for OAuth accounts."},
            {"title": "User model fields", "tag": None,            "detail": "Add oauth_provider and oauth_sub to store the external identity."},
            {"title": "Identity constraint","tag": None,           "detail": "Enforce uniqueness on (provider, sub) to prevent duplicate provider identities."},
        ],
    ))


def before_after(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/before_after.html", _ctx(request=request, 
        view="before-after",
        before_graph_json=json.dumps(D.BEFORE_GRAPH),
        after_graph_json=json.dumps(D.AFTER_GRAPH),
        dep_compare=D.DEP_COMPARE,
        change_summary=[
            {"n":3,"label":"Components added",      "color":"var(--green)","desc":"Google OAuth · Callback API · Authlib"},
            {"n":5,"label":"Components modified",   "color":"var(--amber)","desc":"Auth Service · JWT · User Model · Login · Web"},
            {"n":3,"label":"Potentially affected",  "color":"var(--blue)", "desc":"Middleware · Protected APIs · Database"},
            {"n":0,"label":"Removed",               "color":"var(--red)",  "desc":"Nothing is removed by this change"},
        ],
    ))


def github(request):
    guard = _superuser_guard(request)
    if guard: return guard
    import json as _json
    max_lines = max((f["added"] + f["removed"]) for f in D.GITHUB_DIFF)
    pr_steps = [
        {"key": "fetching",  "label": "Fetch Mock PR Data"},
        {"key": "analyzing", "label": "Analyze Changes"},
        {"key": "report",    "label": "Generate Impact Report"},
        {"key": "preview",   "label": "Preview Report"},
        {"key": "commented", "label": "Mock Post Comment"},
    ]
    return render(request, "views/github.html", _ctx(request=request, 
        view="github",
        github_diff=D.GITHUB_DIFF,
        mock_pr=D.MOCK_PR,
        max_lines=max_lines,
        pr_steps=pr_steps,
        pr_steps_json=_json.dumps(pr_steps),
    ))


def reports(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/reports.html", _ctx(request=request, 
        view="reports",
        current_flow_json=json.dumps(D.CURRENT_FLOW),
        impact_flow_json=json.dumps(D.IMPACT_FLOW),
        dep_compare=D.DEP_COMPARE,
        risk_factors=D.RISK_FACTORS,
        security_impact=D.SECURITY_IMPACT,
        test_impact=D.TEST_IMPACT,
        affected_components=[
            {"l":"Files","v":14},{"l":"Functions","v":27},{"l":"APIs","v":8},{"l":"DB Components","v":3},
            {"l":"Dependencies","v":2},{"l":"Env Variables","v":3},{"l":"Security","v":4},{"l":"Tests","v":9},
        ],
        recommendations=[
            "Gate the rollout behind a feature flag; keep email/password as the default provider.",
            "Enforce OAuth state, nonce and redirect-URI allow-list validation on the callback endpoint.",
            "Link Google accounts by verified email claim only, with an explicit linking step for existing users.",
            "Provision GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET via environment and add them to the rotation policy.",
            "Extend auth, login and JWT test suites to cover both providers before merge.",
            "Rotate JWT_SECRET in the same change window — it is 6 days over policy age.",
        ],
    ))


def history(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/history.html", _ctx(request=request, 
        view="history",
        history=D.HISTORY,
    ))


def admin_panel(request):
    """Custom in-site admin panel — superuser only."""
    if not request.user.is_authenticated or not request.user.is_superuser:
        return redirect("/login/")

    from django.contrib.auth.models import User
    from .models import Project, ChangeAnalysis, GraphNode, GraphEdge, SecurityFinding, Dependency, EnvVariable

    # ── handle POST actions ────────────────────────────────────────────────
    if request.method == "POST":
        action = request.POST.get("action", "")

        # Delete user
        if action == "delete_user":
            uid = request.POST.get("user_id")
            try:
                u = User.objects.get(pk=uid)
                if u != request.user:          # never delete yourself
                    u.delete()
            except User.DoesNotExist:
                pass

        # Toggle staff
        elif action == "toggle_staff":
            uid = request.POST.get("user_id")
            try:
                u = User.objects.get(pk=uid)
                if u != request.user:
                    u.is_staff = not u.is_staff
                    u.save()
            except User.DoesNotExist:
                pass

        # Toggle superuser
        elif action == "toggle_superuser":
            uid = request.POST.get("user_id")
            try:
                u = User.objects.get(pk=uid)
                if u != request.user:
                    u.is_superuser = not u.is_superuser
                    u.is_staff = True if not u.is_superuser else u.is_staff
                    u.save()
            except User.DoesNotExist:
                pass

        # Delete project
        elif action == "delete_project":
            pid = request.POST.get("project_id")
            try:
                Project.objects.get(pk=pid).delete()
            except Project.DoesNotExist:
                pass

        # Delete analysis
        elif action == "delete_analysis":
            aid = request.POST.get("analysis_id")
            try:
                ChangeAnalysis.objects.get(pk=aid).delete()
            except ChangeAnalysis.DoesNotExist:
                pass

        return redirect("/admin-panel/")

    # ── stats ──────────────────────────────────────────────────────────────
    stats = {
        "users":       User.objects.count(),
        "projects":    Project.objects.count(),
        "analyses":    ChangeAnalysis.objects.count(),
        "nodes":       GraphNode.objects.count(),
        "edges":       GraphEdge.objects.count(),
        "security":    SecurityFinding.objects.count(),
        "deps":        Dependency.objects.count(),
        "env_vars":    EnvVariable.objects.count(),
    }

    users     = User.objects.all().order_by("-date_joined")
    projects  = Project.objects.select_related("owner").order_by("-created_at")
    analyses  = ChangeAnalysis.objects.select_related("project", "created_by").order_by("-created_at")[:20]

    return render(request, "views/admin_panel.html", _ctx(request=request, 
        view="admin-panel",
        stats=stats,
        users=users,
        projects=projects,
        analyses=analyses,
    ))


def settings_view(request):
    guard = _superuser_guard(request)
    if guard: return guard
    return render(request, "views/settings.html", _ctx(request=request, 
        view="settings",
        analysis_toggles=[
            {"key":"deep",     "label":"Deep symbol tracing",     "desc":"Cross-file function resolution (slower, more edges)",          "on":True},
            {"key":"tests",    "label":"Include test impact",      "desc":"Map test files into the architecture graph",                   "on":True},
            {"key":"security", "label":"Security rules on connect","desc":"Run security pass automatically after each project connect",   "on":True},
            {"key":"notify",   "label":"Weekly drift digest",      "desc":"Email when architecture drifts from the last baseline",        "on":False},
        ],
    ))


# ─── API endpoints (JSON) ─────────────────────────────────────────────────────

def api_enhance_change(request):
    """Return the enhanced spec for a given change description."""
    return JsonResponse({"enhancedSpec": D.PROJECT["enhancedSpec"]})


def api_agent_answer(request):
    """Simple rule-based agent response (matches ImpactAgent.tsx logic)."""
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    body = json.loads(request.body)
    q = body.get("text", "").lower()
    answer, actions = _agent_answer(q)
    return JsonResponse({"text": answer, "actions": actions})


def api_report_markdown(request):
    """Return the full report as Markdown text for download."""
    md = _build_report_markdown()
    resp = HttpResponse(md, content_type="text/markdown")
    resp["Content-Disposition"] = 'attachment; filename="change-impact-report-google-oauth.md"'
    return resp


def _build_report_markdown():
    p = D.PROJECT
    lines = [
        "# CHANGE IMPACT REPORT",
        f"**Project:** ecommerce-backend · branch main @ 8f42ac1",
        f"**Change:** {p['change']}",
        f"**Generated:** Change Impact v0.9.4",
        "",
        "| Metric | Value |",
        "|---|---|",
        f"| Risk | **{p['risk']}/100 — HIGH** |",
        f"| Blast Radius | {p['blastRadius']}/100 (18% of components) |",
        f"| Prediction Confidence | {p['confidence']}% — HIGH |",
        "",
        "## Project Summary",
        "126 files · 341 functions · 42 APIs · 14 database models · 34 dependencies · 11 env vars · 67 tests.",
        "Health: 78/100 · Security 72/100 · Dependencies 81/100.",
        "",
        "## Proposed Change (Enhanced Specification)",
        p["enhancedSpec"],
        "",
        "## Affected Components",
        "Files 14 · Functions 27 · APIs 8 · Database 3 · Dependencies 2 · Env vars 3 · Security concerns 4 · Test areas 9.",
        "",
        "## Risk — contributing factors",
    ]
    for f in D.RISK_FACTORS:
        lines.append(f"- {f['name']}: {f['value']}/100 — {f['detail']}")
    lines += [
        "",
        f"## Confidence",
        f"{p['confidence']}% — prediction strongly supported by detected project relationships.",
        "",
        "## Dependency Impact",
    ]
    for d in D.DEP_COMPARE:
        lines.append(f"- {d['name']}: {d['before']} → {d['after']} ({d['status']})")
    lines += ["", "## Security Impact"]
    for s in D.SECURITY_IMPACT:
        lines.append(f"- [{s['severity'].upper()}] {s['title']} — {s['why']}")
    lines += ["", "## Test Impact — 9 areas recommended for review"]
    for t in D.TEST_IMPACT:
        lines.append(f"- [{t['level'].upper()}] {t['area']} — {t['note']}")
    lines += [
        "",
        "## Recommendations",
        "1. Gate behind a staged rollout; keep email/password as the default provider.",
        "2. Enforce OAuth state, nonce and redirect-URI allow-list validation on the callback.",
        "3. Link Google accounts by verified email claim only; require an explicit link step for existing users.",
        "4. Provision GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET via environment; add to rotation policy.",
        "5. Extend the auth/JWT test suites to cover both providers before merge.",
        "6. Rotate JWT_SECRET (over policy age) in the same change window.",
    ]
    return "\n".join(lines)


def _has(text, words):
    return any(w in text for w in words)


def _agent_answer(q):
    if _has(q, ["what", "do", "platform", "change impact", "website", "app"]):
        return (
            "Change Impact helps engineers understand a code change before implementing it. "
            "It analyzes a project, reconstructs the current architecture flow, lets you describe "
            "a proposed change, simulates new relationships, then reports affected files, functions, "
            "APIs, database components, dependencies, environment variables, security concerns, tests, "
            "blast radius, risk and confidence.",
            [{"label": "Project Overview", "view": "overview"}, {"label": "Current Flow", "view": "current-flow"}]
        )
    if _has(q, ["graph", "drag", "node", "editor", "canvas", "connection", "zoom", "pan"]):
        return (
            "The graph editor is interactive: drag nodes, pan the canvas, mouse-wheel zoom, "
            "shift-click or shift-drag for multi-select, add nodes, delete nodes or edges, "
            "rename nodes, change node type, edit details, connect nodes, search, filter, "
            "focus a node, highlight dependency paths, reset, auto-layout, fit view and export SVG. "
            "Click any node to open its inspector.",
            [{"label": "Open Graph Explorer", "view": "impact-graph"}]
        )
    if _has(q, ["risk", "google", "login", "oauth", "high", "87", "authentication"]):
        return (
            "The Google Login simulation is high risk because it modifies the authentication decision "
            "point, introduces Google OAuth, changes Login API behavior, touches JWT issuance, "
            "affects middleware-protected APIs, requires user-model/account-linking changes, adds "
            "OAuth secrets, and expands security test coverage. "
            "Current score: Risk 87/100 HIGH, Blast Radius 18/100, Confidence 91%.",
            [{"label": "Impact Analysis", "view": "impact-analysis"}, {"label": "Security Impact", "view": "security"}]
        )
    if _has(q, ["blast", "radius", "affected", "files", "functions", "apis", "components"]):
        return (
            "Blast Radius is 18/100: about 18% of analyzed components are potentially connected to "
            "the change. The simulation estimates 14 files, 27 functions, 8 APIs, 3 database "
            "components, 2 dependencies, 3 environment variables, 4 security concerns and 9 test areas affected.",
            [{"label": "View Impact Metrics", "view": "impact-analysis"}]
        )
    if _has(q, ["confidence", "certain", "accuracy", "91", "prediction"]):
        return (
            "Prediction Confidence is 91%, which means the result is strongly supported by detected "
            "project relationships and dependency evidence. It does not mean certainty. The safest "
            "path is to validate with the recommended security checks and test areas before implementation.",
            [{"label": "Open Report", "view": "reports"}]
        )
    if _has(q, ["security", "secret", "callback", "account", "token", "environment", "env"]):
        return (
            "Security focus areas: OAuth callback validation is HIGH, account linking is HIGH, "
            "token lifecycle is MEDIUM and secret configuration is MEDIUM. Secret values are never "
            "displayed. For OAuth, provision GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET through "
            "environment configuration and validate state, nonce and redirect URI allow-lists.",
            [{"label": "Security", "view": "security"}, {"label": "Environment", "view": "environment"}]
        )
    if _has(q, ["test", "testing", "pytest", "review", "ship", "before shipping", "recommendation"]):
        return (
            "Before shipping, review 9 test areas: Authentication Tests HIGH, Login API Tests HIGH, "
            "JWT Tests HIGH, Profile API Tests MEDIUM, Registration Tests MEDIUM and Order API Tests LOW. "
            "Also validate callback security, account linking, JWT claims parity and environment secret handling.",
            [{"label": "Open Final Report", "view": "reports"}]
        )
    if _has(q, ["github", "branch", "pull", "pr", "commit", "compare"]):
        return (
            "The GitHub workspace compares ecommerce-backend main against feature/google-oauth. "
            "The demo diff shows 8 files changed, 13 functions changed, 241 lines added and 74 removed. "
            "You can compare branches, compare commits, analyze a pull request, then run Change Impact on the diff.",
            [{"label": "Open GitHub Workspace", "view": "github"}]
        )
    if _has(q, ["report", "download", "history", "previous", "analysis"]):
        return (
            "Reports summarize the project, current flow, proposed change, simulation, impact graph, "
            "affected components, blast radius, risk, confidence, dependency impact, security impact, "
            "test impact, before/after comparison and recommendations. The report can be downloaded as "
            "Markdown, and previous analyses are available in History.",
            [{"label": "Open Report", "view": "reports"}, {"label": "Open History", "view": "history"}]
        )
    if _has(q, ["dependency", "dependencies", "flask", "pyjwt", "authlib", "sqlalchemy"]):
        return (
            "Current key dependencies include Flask 3.1.0, SQLAlchemy 2.0.41, PyJWT 2.8.0, "
            "Requests 2.32.0 and Flask-CORS 4.0.0. The proposed change adds Authlib 1.3.2, "
            "removes OldAuthLib 2.1.0 and recommends compatibility review for dependency changes.",
            [{"label": "Dependencies", "view": "dependencies"}, {"label": "Before vs After", "view": "before-after"}]
        )
    if _has(q, ["start", "where", "how", "flow", "steps", "guide", "navigate"]):
        return (
            "Recommended path: Add Project → Project Analysis → Current Flow → Analyze Change → "
            "What-If Simulation → Impact Analysis → Impact Graph → Before vs After → Report. "
            "The product is graph-first; use the diagram to understand how the change propagates before touching code.",
            [{"label": "Add Project", "view": "add-project"}, {"label": "Analyze Change", "view": "analyze-change"}]
        )
    return (
        "I can help with the Change Impact workspace: project analysis, current flow, interactive graphs, "
        "what-if simulation, impact metrics, risk, blast radius, confidence, dependencies, security, "
        "test impact, GitHub comparison, reports and history. "
        "Try asking: 'Why is risk high?' or 'How do I use the graph editor?'",
        [{"label": "Current Flow", "view": "current-flow"}, {"label": "Impact Analysis", "view": "impact-analysis"}]
    )


