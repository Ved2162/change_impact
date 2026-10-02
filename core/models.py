from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """Represents a connected codebase workspace."""
    name = models.CharField(max_length=255)
    branch = models.CharField(max_length=255, default='main')
    compare_branch = models.CharField(max_length=255, default='')
    language = models.CharField(max_length=100, default='')
    framework = models.CharField(max_length=100, default='')

    # stats
    stat_files = models.IntegerField(default=0)
    stat_functions = models.IntegerField(default=0)
    stat_apis = models.IntegerField(default=0)
    stat_db_models = models.IntegerField(default=0)
    stat_dependencies = models.IntegerField(default=0)
    stat_env_vars = models.IntegerField(default=0)
    stat_tests = models.IntegerField(default=0)
    stat_security_findings = models.IntegerField(default=0)

    # health
    health_project = models.IntegerField(default=0)
    health_security = models.IntegerField(default=0)
    health_dependencies = models.IntegerField(default=0)
    health_maintainability = models.IntegerField(default=0)
    health_configuration = models.IntegerField(default=0)

    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ci_projects'

    def __str__(self):
        return self.name


class ChangeAnalysis(models.Model):
    """A recorded change-impact simulation (history entry)."""
    RISK_CHOICES = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    analysis_id = models.CharField(max_length=20, unique=True)  # e.g. AN-1042
    name = models.CharField(max_length=255)
    change_description = models.TextField()
    enhanced_spec = models.TextField(blank=True)
    risk = models.CharField(max_length=10, choices=RISK_CHOICES, default='Low')
    risk_score = models.IntegerField(default=0)
    blast_radius = models.IntegerField(default=0)
    confidence = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'ci_analyses'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.analysis_id} – {self.name}'


class GraphNode(models.Model):
    """A node in a project's architecture graph."""
    NODE_TYPES = [
        ('file', 'File'), ('function', 'Function'), ('class', 'Class'),
        ('api', 'API'), ('database', 'Database'), ('service', 'Service'),
        ('dependency', 'Dependency'), ('env', 'Env Variable'),
        ('test', 'Test'), ('external', 'External'), ('user', 'User'),
    ]
    IMPACT_LEVELS = [('high', 'High'), ('medium', 'Medium'), ('low', 'Low')]
    STATUS_CHOICES = [
        ('added', 'Added'), ('removed', 'Removed'), ('modified', 'Modified'),
        ('affected', 'Affected'), ('unchanged', 'Unchanged'),
    ]

    analysis = models.ForeignKey(ChangeAnalysis, on_delete=models.CASCADE, null=True, blank=True)
    node_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    node_type = models.CharField(max_length=20, choices=NODE_TYPES)
    tech = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    pos_x = models.FloatField(default=0)
    pos_y = models.FloatField(default=0)
    impact = models.CharField(max_length=10, choices=IMPACT_LEVELS, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, blank=True)
    confidence = models.IntegerField(null=True, blank=True)
    why = models.TextField(blank=True)

    class Meta:
        db_table = 'ci_graph_nodes'

    def __str__(self):
        return self.name


class GraphEdge(models.Model):
    """A directed edge between two graph nodes."""
    STATUS_CHOICES = [('added', 'Added'), ('removed', 'Removed'), ('modified', 'Modified')]
    IMPACT_LEVELS = [('high', 'High'), ('medium', 'Medium'), ('low', 'Low')]

    analysis = models.ForeignKey(ChangeAnalysis, on_delete=models.CASCADE, null=True, blank=True)
    edge_id = models.CharField(max_length=64)
    source = models.CharField(max_length=64)
    target = models.CharField(max_length=64)
    impact = models.CharField(max_length=10, choices=IMPACT_LEVELS, blank=True)
    indirect = models.BooleanField(default=False)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, blank=True)
    label = models.CharField(max_length=128, blank=True)

    class Meta:
        db_table = 'ci_graph_edges'

    def __str__(self):
        return f'{self.source} → {self.target}'


class SecurityFinding(models.Model):
    """Security finding tied to a project analysis."""
    SEVERITY_CHOICES = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    finding_id = models.CharField(max_length=20)
    title = models.CharField(max_length=255)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    area = models.CharField(max_length=255)
    detail = models.TextField()

    class Meta:
        db_table = 'ci_security_findings'

    def __str__(self):
        return f'{self.finding_id}: {self.title}'


class Dependency(models.Model):
    """Package dependency for a project."""
    STATUS_CHOICES = [
        ('Healthy', 'Healthy'), ('Update Recommended', 'Update Recommended'),
        ('Security Risk', 'Security Risk'), ('Review', 'Review'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    version = models.CharField(max_length=64)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Healthy')
    used_by = models.IntegerField(default=0)
    license = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = 'ci_dependencies'

    def __str__(self):
        return f'{self.name} {self.version}'


class EnvVariable(models.Model):
    """Environment variable detected in a project."""
    STATUS_CHOICES = [('set', 'Set'), ('missing', 'Missing')]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    required = models.BooleanField(default=True)
    used_by = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='set')
    rotated = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = 'ci_env_variables'

    def __str__(self):
        return self.name
