from django.contrib import admin
from django.utils.html import format_html
from .models import Project, ChangeAnalysis, GraphNode, GraphEdge, SecurityFinding, Dependency, EnvVariable

# ── Site branding ─────────────────────────────────────────────────────────
admin.site.site_header  = "⚡ ChangeImpact Admin"
admin.site.site_title   = "ChangeImpact"
admin.site.index_title  = "Master Control Panel"


# ── Inline: analyses inside a project ─────────────────────────────────────
class ChangeAnalysisInline(admin.TabularInline):
    model = ChangeAnalysis
    extra = 0
    fields = ('analysis_id', 'name', 'risk', 'risk_score', 'blast_radius', 'confidence', 'created_at')
    readonly_fields = ('analysis_id', 'created_at')
    show_change_link = True


class DependencyInline(admin.TabularInline):
    model = Dependency
    extra = 0
    fields = ('name', 'version', 'status', 'used_by', 'license')


class EnvVariableInline(admin.TabularInline):
    model = EnvVariable
    extra = 0
    fields = ('name', 'required', 'status', 'used_by', 'rotated')


class SecurityFindingInline(admin.TabularInline):
    model = SecurityFinding
    extra = 0
    fields = ('finding_id', 'title', 'severity', 'area')


# ── Inline: nodes / edges inside an analysis ──────────────────────────────
class GraphNodeInline(admin.TabularInline):
    model = GraphNode
    extra = 0
    fields = ('node_id', 'name', 'node_type', 'impact', 'status', 'confidence')
    readonly_fields = ('node_id',)


class GraphEdgeInline(admin.TabularInline):
    model = GraphEdge
    extra = 0
    fields = ('edge_id', 'source', 'target', 'impact', 'indirect', 'status', 'label')
    readonly_fields = ('edge_id',)


# ── Project ───────────────────────────────────────────────────────────────
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display  = ('name', 'branch', 'language', 'framework',
                     'stat_files', 'stat_functions', 'health_badge',
                     'owner', 'created_at')
    list_filter   = ('language', 'framework')
    search_fields = ('name', 'branch', 'owner__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering      = ('-created_at',)

    fieldsets = (
        ('Project Info', {
            'fields': ('name', 'branch', 'compare_branch', 'language', 'framework', 'owner')
        }),
        ('Stats', {
            'classes': ('collapse',),
            'fields': (
                ('stat_files', 'stat_functions', 'stat_apis'),
                ('stat_db_models', 'stat_dependencies', 'stat_env_vars'),
                ('stat_tests', 'stat_security_findings'),
            )
        }),
        ('Health Scores', {
            'classes': ('collapse',),
            'fields': (
                ('health_project', 'health_security'),
                ('health_dependencies', 'health_maintainability', 'health_configuration'),
            )
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at')
        }),
    )

    inlines = [ChangeAnalysisInline, DependencyInline, EnvVariableInline, SecurityFindingInline]

    @admin.display(description='Health')
    def health_badge(self, obj):
        score = obj.health_project
        if score >= 75:
            color = '#4cb782'
        elif score >= 50:
            color = '#d6a34a'
        else:
            color = '#e05252'
        return format_html(
            '<span style="color:{};font-weight:700;">{}/100</span>',
            color, score
        )


# ── ChangeAnalysis ────────────────────────────────────────────────────────
@admin.register(ChangeAnalysis)
class ChangeAnalysisAdmin(admin.ModelAdmin):
    list_display  = ('analysis_id', 'name', 'project', 'risk_badge',
                     'risk_score', 'blast_radius', 'confidence',
                     'created_by', 'created_at')
    list_filter   = ('risk', 'project')
    search_fields = ('analysis_id', 'name', 'change_description', 'created_by__username')
    readonly_fields = ('created_at',)
    ordering      = ('-created_at',)

    fieldsets = (
        ('Analysis', {
            'fields': ('project', 'analysis_id', 'name', 'change_description', 'enhanced_spec')
        }),
        ('Scores', {
            'fields': (('risk', 'risk_score'), ('blast_radius', 'confidence'))
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at')
        }),
    )

    inlines = [GraphNodeInline, GraphEdgeInline]

    @admin.display(description='Risk')
    def risk_badge(self, obj):
        colors = {'High': '#e05252', 'Medium': '#d6a34a', 'Low': '#4cb782'}
        color = colors.get(obj.risk, '#a8b3c4')
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color, obj.risk
        )


# ── GraphNode ─────────────────────────────────────────────────────────────
@admin.register(GraphNode)
class GraphNodeAdmin(admin.ModelAdmin):
    list_display  = ('name', 'node_type', 'analysis', 'impact_badge', 'status', 'confidence')
    list_filter   = ('node_type', 'impact', 'status')
    search_fields = ('name', 'node_id', 'description', 'tech')
    ordering      = ('analysis', 'name')

    @admin.display(description='Impact')
    def impact_badge(self, obj):
        colors = {'high': '#e05252', 'medium': '#d6a34a', 'low': '#4cb782'}
        color = colors.get(obj.impact, '#a8b3c4')
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color, obj.impact or '—'
        )


# ── GraphEdge ─────────────────────────────────────────────────────────────
@admin.register(GraphEdge)
class GraphEdgeAdmin(admin.ModelAdmin):
    list_display  = ('edge_id', 'source', 'target', 'analysis', 'impact', 'indirect', 'status', 'label')
    list_filter   = ('impact', 'status', 'indirect')
    search_fields = ('edge_id', 'source', 'target', 'label')
    ordering      = ('analysis',)


# ── SecurityFinding ───────────────────────────────────────────────────────
@admin.register(SecurityFinding)
class SecurityFindingAdmin(admin.ModelAdmin):
    list_display  = ('finding_id', 'title', 'severity_badge', 'area', 'project')
    list_filter   = ('severity', 'project')
    search_fields = ('finding_id', 'title', 'area', 'detail')
    ordering      = ('project', 'severity')

    @admin.display(description='Severity')
    def severity_badge(self, obj):
        colors = {'High': '#e05252', 'Medium': '#d6a34a', 'Low': '#4cb782'}
        color = colors.get(obj.severity, '#a8b3c4')
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color, obj.severity
        )


# ── Dependency ────────────────────────────────────────────────────────────
@admin.register(Dependency)
class DependencyAdmin(admin.ModelAdmin):
    list_display  = ('name', 'version', 'status_badge', 'used_by', 'license', 'project')
    list_filter   = ('status', 'project')
    search_fields = ('name', 'version', 'license')
    ordering      = ('project', 'name')

    @admin.display(description='Status')
    def status_badge(self, obj):
        colors = {
            'Healthy': '#4cb782',
            'Update Recommended': '#d6a34a',
            'Security Risk': '#e05252',
            'Review': '#9aa6ff',
        }
        color = colors.get(obj.status, '#a8b3c4')
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color, obj.status
        )


# ── EnvVariable ───────────────────────────────────────────────────────────
@admin.register(EnvVariable)
class EnvVariableAdmin(admin.ModelAdmin):
    list_display  = ('name', 'status_badge', 'required', 'used_by', 'rotated', 'project')
    list_filter   = ('status', 'required', 'project')
    search_fields = ('name', 'used_by')
    ordering      = ('project', 'name')

    @admin.display(description='Status')
    def status_badge(self, obj):
        color = '#4cb782' if obj.status == 'set' else '#e05252'
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color, obj.status
        )
