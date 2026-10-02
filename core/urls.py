from django.urls import path
from . import views

urlpatterns = [
    # ── auth ──────────────────────────────────────────────────────────────
    path('login/',  views.login_view,  name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),

    # ── workspace pages ───────────────────────────────────────────────────
    path('',                        views.home,                 name='home'),
    path('home/',                   views.home,                 name='home-alt'),
    path('add-project/',            views.add_project,          name='add-project'),
    path('analysis/',               views.analysis,             name='analysis'),
    path('overview/',               views.overview,             name='overview'),
    path('current-flow/',           views.current_flow,         name='current-flow'),
    path('project-insights/',       views.project_insights,     name='project-insights'),
    path('dependencies/',           views.dependencies,         name='dependencies'),
    path('security/',               views.security,             name='security'),
    path('environment/',            views.environment,          name='environment'),
    path('analyze-change/',         views.analyze_change,       name='analyze-change'),
    path('what-if/',                views.what_if,              name='what-if'),
    path('impact-analysis/',        views.impact_analysis,      name='impact-analysis'),
    path('impact-graph/',           views.impact_graph,         name='impact-graph'),
    path('change-impact-report/',   views.change_impact_report, name='change-impact-report'),
    path('before-after/',           views.before_after,         name='before-after'),
    path('github/',                 views.github,               name='github'),
    path('reports/',                views.reports,              name='reports'),
    path('history/',                views.history,              name='history'),
    path('settings/',               views.settings_view,        name='settings'),

    path('admin-panel/',            views.admin_panel,          name='admin-panel'),

    # ── JSON API ──────────────────────────────────────────────────────────
    path('api/enhance-change/',     views.api_enhance_change,   name='api-enhance-change'),
    path('api/agent/',              views.api_agent_answer,     name='api-agent'),
    path('api/report/markdown/',    views.api_report_markdown,  name='api-report-markdown'),
]
