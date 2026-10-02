"""
Change Impact · Demo workspace data (ported from src/data/demo.ts)
Single consistent project: ecommerce-backend
Change: "Add Google Login while keeping the existing authentication system."
"""

PROJECT = {
    "name": "ecommerce-backend",
    "branch": "main",
    "compareBranch": "feature/google-oauth",
    "language": "Python 3.12",
    "framework": "Flask 3.1.0",
    "stats": {
        "files": 126, "functions": 341, "apis": 42, "dbModels": 14,
        "dependencies": 34, "envVars": 11, "tests": 67, "securityFindings": 15,
    },
    "health": {
        "project": 78, "security": 72, "dependencies": 81,
        "maintainability": 76, "configuration": 84,
    },
    "impact": {
        "files": 14, "functions": 27, "apis": 8, "db": 3,
        "dependencies": 2, "env": 3, "security": 4, "tests": 9,
    },
    "blastRadius": 18,
    "risk": 87,
    "confidence": 91,
    "change": "Add Google Login while keeping the existing authentication system.",
    "enhancedSpec": (
        "Add Google OAuth 2.0 while keeping the existing email/password authentication system. "
        "Continue using the current JWT system for session issuance and validation. "
        "Store OAuth client credentials as environment variables. "
        "Automatically link Google accounts to existing users by verified email, "
        "create new users on first sign-in, and validate all OAuth callbacks against "
        "a registered redirect URI allow-list."
    ),
}

RISK_FACTORS = [
    {"name": "Authentication Impact", "value": 92, "detail": "Core sign-in path gains a second identity provider."},
    {"name": "Security Impact", "value": 81, "detail": "New callback surface, token lifecycle and secret handling."},
    {"name": "API Impact", "value": 78, "detail": "8 API routes touch authentication or session claims."},
    {"name": "Database Dependency", "value": 66, "detail": "User model requires OAuth identity fields."},
    {"name": "Test Impact", "value": 54, "detail": "9 test areas reference the login flow."},
]

CURRENT_FLOW = {
    "nodes": [
        {"id": "user",       "name": "End User",            "type": "user",       "x": 0,    "y": 0,    "tech": "Browser · OAuth Agent", "description": "Actor initiating requests through the web client."},
        {"id": "web",        "name": "Web Client",          "type": "external",   "x": 0,    "y": 150,  "tech": "React 18 SPA",           "description": "Storefront frontend, stores JWT in memory."},
        {"id": "api-login",  "name": "Login API",           "type": "api",        "x": -130, "y": 300,  "tech": "POST /auth/login",       "description": "Email + password sign-in endpoint.", "confidence": 96},
        {"id": "api-reg",    "name": "Register API",        "type": "api",        "x": 170,  "y": 300,  "tech": "POST /auth/register",    "description": "Creates local users, sends welcome email."},
        {"id": "svc-auth",   "name": "Auth Service",        "type": "service",    "x": 0,    "y": 460,  "tech": "auth/service.py",        "description": "Credential verification, account lifecycle.", "confidence": 94},
        {"id": "svc-email",  "name": "Email Service",       "type": "external",   "x": 420,  "y": 460,  "tech": "SendGrid",               "description": "Transactional email via EMAIL_API_KEY."},
        {"id": "fn-jwt",     "name": "JWT Service",         "type": "function",   "x": -20,  "y": 630,  "tech": "auth/jwt_service.py",    "description": "Issue / refresh / verify RS256 tokens.", "confidence": 97},
        {"id": "mdl-user",   "name": "User Model",          "type": "class",      "x": 260,  "y": 630,  "tech": "models/user.py",         "description": "SQLAlchemy user entity + password hash."},
        {"id": "fn-mw",      "name": "JWT Auth Middleware", "type": "function",   "x": -20,  "y": 800,  "tech": "middleware/jwt.py",      "description": "Guards protected routes, resolves claims.", "confidence": 95},
        {"id": "api-prof",   "name": "Profile API",         "type": "api",        "x": -300, "y": 980,  "tech": "GET /me",                "description": "Reads current user profile."},
        {"id": "api-orders", "name": "Orders API",          "type": "api",        "x": -20,  "y": 980,  "tech": "GET/POST /orders",       "description": "Order placement and history."},
        {"id": "api-pay",    "name": "Payments API",        "type": "api",        "x": 260,  "y": 980,  "tech": "POST /payments",         "description": "Checkout and refund processing."},
        {"id": "db",         "name": "PostgreSQL",          "type": "database",   "x": 130,  "y": 1150, "tech": "PostgreSQL 15",          "description": "users · orders · payments · sessions.", "confidence": 93},
        {"id": "env-jwt",    "name": "JWT_SECRET",          "type": "env",        "x": -370, "y": 630,  "tech": "environment",            "description": "Token signing key. Value never stored in repo."},
        {"id": "env-db",     "name": "DATABASE_URL",        "type": "env",        "x": -370, "y": 1150, "tech": "environment",            "description": "Connection string for primary database."},
        {"id": "dep-flask",  "name": "Flask 3.1.0",         "type": "dependency", "x": -470, "y": 460,  "tech": "pip",                   "description": "Web framework — healthy."},
        {"id": "dep-pyjwt",  "name": "PyJWT 2.8.0",         "type": "dependency", "x": -470, "y": 770,  "tech": "pip",                   "description": "JWT encode/decode — healthy."},
        {"id": "dep-sqla",   "name": "SQLAlchemy 2.0.41",   "type": "dependency", "x": 470,  "y": 1150, "tech": "pip",                   "description": "ORM powering all models."},
        {"id": "test-login", "name": "Login API Tests",     "type": "test",       "x": 470,  "y": 300,  "tech": "pytest · 14 cases",      "description": "Covers sign-in, lockout, bad credentials."},
        {"id": "test-auth",  "name": "Auth Service Tests",  "type": "test",       "x": 700,  "y": 630,  "tech": "pytest · 21 cases",      "description": "Credential + token lifecycle coverage."},
    ],
    "edges": [
        {"id": "e1",  "source": "user",       "target": "web"},
        {"id": "e2",  "source": "web",        "target": "api-login"},
        {"id": "e3",  "source": "web",        "target": "api-reg"},
        {"id": "e4",  "source": "api-login",  "target": "svc-auth"},
        {"id": "e5",  "source": "api-reg",    "target": "svc-auth"},
        {"id": "e6",  "source": "svc-auth",   "target": "fn-jwt"},
        {"id": "e7",  "source": "svc-auth",   "target": "mdl-user"},
        {"id": "e8",  "source": "svc-auth",   "target": "svc-email"},
        {"id": "e9",  "source": "fn-jwt",     "target": "fn-mw"},
        {"id": "e10", "source": "mdl-user",   "target": "db"},
        {"id": "e11", "source": "fn-mw",      "target": "api-prof"},
        {"id": "e12", "source": "fn-mw",      "target": "api-orders"},
        {"id": "e13", "source": "fn-mw",      "target": "api-pay"},
        {"id": "e14", "source": "api-prof",   "target": "db"},
        {"id": "e15", "source": "api-orders", "target": "db"},
        {"id": "e16", "source": "api-pay",    "target": "db"},
        {"id": "e17", "source": "env-jwt",    "target": "fn-jwt",   "indirect": True, "label": "config"},
        {"id": "e18", "source": "env-db",     "target": "db",       "indirect": True, "label": "config"},
        {"id": "e19", "source": "dep-flask",  "target": "svc-auth", "indirect": True},
        {"id": "e20", "source": "dep-pyjwt",  "target": "fn-jwt",   "indirect": True},
        {"id": "e21", "source": "dep-sqla",   "target": "mdl-user", "indirect": True},
        {"id": "e22", "source": "test-login", "target": "api-login", "indirect": True},
        {"id": "e23", "source": "test-auth",  "target": "svc-auth",  "indirect": True},
    ],
}

IMPACT_FLOW = {
    "nodes": [
        {"id": "env-oauth", "name": "OAuth Env Vars",     "type": "env",      "x": -530, "y": 0,   "tech": "GOOGLE_CLIENT_ID / SECRET", "description": "New required configuration.", "impact": "medium", "status": "added",    "confidence": 88, "why": "OAuth client credentials must be provisioned and rotated without code changes."},
        {"id": "oauth",     "name": "Google OAuth",       "type": "external", "x": 0,    "y": 0,   "tech": "Google Identity",  "description": "New external identity provider.", "impact": "high",   "status": "added",    "confidence": 97, "why": "The proposed change introduces Google as a second identity provider for sign-in."},
        {"id": "auth",      "name": "Authentication",     "type": "service",  "x": 0,    "y": 170, "tech": "auth/service.py",  "description": "Central authentication decision point.", "impact": "high",   "status": "modified", "confidence": 94, "why": "Auth service must branch between password and Google identity verification."},
        {"id": "jwt",       "name": "JWT Service",        "type": "function", "x": -460, "y": 340, "tech": "auth/jwt_service.py", "description": "Token issuing for OAuth sessions.", "impact": "high",   "status": "affected", "confidence": 96, "why": "OAuth sign-ins must mint the same JWT shape so downstream guards keep working."},
        {"id": "usr",       "name": "User Model",         "type": "class",    "x": 0,    "y": 340, "tech": "models/user.py",   "description": "Stores identity + provider link.", "impact": "medium", "status": "modified", "confidence": 89, "why": "Requires oauth_provider / oauth_sub columns and account-linking rules by verified email."},
        {"id": "login",     "name": "Login API",          "type": "api",      "x": 460,  "y": 340, "tech": "POST /auth/login", "description": "Extended with Google flow.", "impact": "high",   "status": "modified", "confidence": 93, "why": "Login endpoint gains /auth/google and callback validation; existing login must remain unchanged."},
        {"id": "mw",        "name": "Auth Middleware",    "type": "function", "x": -460, "y": 510, "tech": "middleware/jwt.py", "description": "Validates issued tokens.", "impact": "high",   "status": "affected", "confidence": 92, "why": "Must accept tokens issued for OAuth sessions and enforce identical claim checks."},
        {"id": "db",        "name": "PostgreSQL",         "type": "database", "x": 0,    "y": 510, "tech": "PostgreSQL 15",   "description": "Identity data + migrations.", "impact": "medium", "status": "affected", "confidence": 90, "why": "Migration adds OAuth identity columns; unique constraint on (provider, sub)."},
        {"id": "fe",        "name": "Frontend",           "type": "external", "x": 460,  "y": 510, "tech": "React SPA",       "description": "Sign-in UI with Google button.", "impact": "medium", "status": "affected", "confidence": 86, "why": "Login page renders Google sign-in and handles the OAuth redirect round-trip."},
        {"id": "apis",      "name": "Protected APIs",     "type": "api",      "x": -460, "y": 680, "tech": "42 routes",       "description": "Profile · Orders · Payments.", "impact": "high",   "status": "affected", "confidence": 91, "why": "All protected routes inherit session behavior changes through the middleware."},
        {"id": "tests",     "name": "Test Suite",         "type": "test",     "x": -460, "y": 850, "tech": "pytest · 9 areas","description": "Auth & API tests need review.", "impact": "medium", "status": "affected", "confidence": 84, "why": "Auth, Login API and JWT tests must cover both providers; 9 areas recommended for review."},
    ],
    "edges": [
        {"id": "i0",  "source": "env-oauth", "target": "oauth",  "status": "added",  "impact": "medium", "label": "config"},
        {"id": "i1",  "source": "oauth",  "target": "auth",   "status": "added",  "impact": "high"},
        {"id": "i2",  "source": "auth",   "target": "jwt",    "impact": "high"},
        {"id": "i3",  "source": "auth",   "target": "usr",    "impact": "medium"},
        {"id": "i4",  "source": "auth",   "target": "login",  "impact": "high"},
        {"id": "i5",  "source": "jwt",    "target": "mw",     "impact": "high"},
        {"id": "i6",  "source": "usr",    "target": "db",     "impact": "medium"},
        {"id": "i7",  "source": "login",  "target": "fe",     "impact": "medium"},
        {"id": "i8",  "source": "mw",     "target": "apis",   "impact": "high"},
        {"id": "i9",  "source": "apis",   "target": "tests",  "impact": "medium"},
        {"id": "i10", "source": "oauth",  "target": "mw",     "impact": "medium", "indirect": True, "label": "indirect"},
        {"id": "i11", "source": "auth",   "target": "db",     "impact": "low",    "indirect": True, "label": "indirect"},
        {"id": "i12", "source": "login",  "target": "tests",  "impact": "low",    "indirect": True, "label": "indirect"},
    ],
}

BEFORE_GRAPH = {
    "nodes": [
        {"id": "b-web",   "name": "Web Client",      "type": "external", "x": 0,    "y": 0,   "tech": "React SPA",         "status": "unchanged"},
        {"id": "b-login", "name": "Login API",        "type": "api",      "x": 0,    "y": 150, "tech": "POST /auth/login",  "status": "unchanged", "description": "Email + password only."},
        {"id": "b-auth",  "name": "Auth Service",     "type": "service",  "x": 0,    "y": 300, "tech": "auth/service.py",   "status": "unchanged"},
        {"id": "b-jwt",   "name": "JWT Service",      "type": "function", "x": -180, "y": 460, "tech": "auth/jwt_service.py","status": "unchanged"},
        {"id": "b-user",  "name": "User Model",       "type": "class",    "x": 180,  "y": 460, "tech": "models/user.py",    "status": "unchanged"},
        {"id": "b-mw",    "name": "Auth Middleware",  "type": "function", "x": -180, "y": 620, "tech": "middleware/jwt.py", "status": "unchanged"},
        {"id": "b-apis",  "name": "Protected APIs",   "type": "api",      "x": -180, "y": 780, "tech": "42 routes",         "status": "unchanged"},
        {"id": "b-db",    "name": "PostgreSQL",        "type": "database", "x": 180,  "y": 640, "tech": "PostgreSQL 15",     "status": "unchanged"},
    ],
    "edges": [
        {"id": "b1", "source": "b-web",   "target": "b-login"},
        {"id": "b2", "source": "b-login", "target": "b-auth"},
        {"id": "b3", "source": "b-auth",  "target": "b-jwt"},
        {"id": "b4", "source": "b-auth",  "target": "b-user"},
        {"id": "b5", "source": "b-jwt",   "target": "b-mw"},
        {"id": "b6", "source": "b-mw",    "target": "b-apis"},
        {"id": "b7", "source": "b-user",  "target": "b-db"},
    ],
}

AFTER_GRAPH = {
    "nodes": [
        {"id": "a-web",   "name": "Web Client",         "type": "external",   "x": 0,   "y": 0,   "tech": "React SPA",                   "status": "modified", "description": "Adds Google sign-in button + redirect."},
        {"id": "a-oauth", "name": "Google OAuth",       "type": "external",   "x": 300, "y": 0,   "tech": "Google Identity",             "status": "added",    "description": "New identity provider."},
        {"id": "a-login", "name": "Login API",          "type": "api",        "x": 0,   "y": 150, "tech": "POST /auth/login · /auth/google","status": "modified","description": "Adds Google exchange endpoint."},
        {"id": "a-cb",    "name": "OAuth Callback API", "type": "api",        "x": 300, "y": 150, "tech": "GET /auth/google/callback",    "status": "added",    "description": "Validates state + redirect allow-list."},
        {"id": "a-auth",  "name": "Auth Service",       "type": "service",    "x": 0,   "y": 300, "tech": "auth/service.py",             "status": "modified", "description": "Branches password vs Google identity."},
        {"id": "a-jwt",   "name": "JWT + OAuth Service","type": "function",   "x": -180,"y": 460, "tech": "auth/jwt_service.py",         "status": "modified", "description": "Issues identical JWT for OAuth sessions."},
        {"id": "a-user",  "name": "User Model",         "type": "class",      "x": 180, "y": 460, "tech": "models/user.py",              "status": "modified", "description": "+ oauth_provider / oauth_sub columns."},
        {"id": "a-mw",    "name": "Auth Middleware",    "type": "function",   "x": -180,"y": 620, "tech": "middleware/jwt.py",           "status": "affected"},
        {"id": "a-apis",  "name": "Protected APIs",     "type": "api",        "x": -180,"y": 780, "tech": "42 routes",                  "status": "affected"},
        {"id": "a-db",    "name": "PostgreSQL",         "type": "database",   "x": 180, "y": 640, "tech": "PostgreSQL 15",              "status": "affected", "description": "Migration 0042_oauth_identity."},
        {"id": "a-dep",   "name": "Authlib 1.3.2",      "type": "dependency", "x": 480, "y": 300, "tech": "pip (new)",                  "status": "added",    "description": "OAuth client library."},
    ],
    "edges": [
        {"id": "a1",  "source": "a-web",   "target": "a-login"},
        {"id": "a2",  "source": "a-oauth", "target": "a-cb",    "status": "added"},
        {"id": "a3",  "source": "a-oauth", "target": "a-login", "status": "added"},
        {"id": "a4",  "source": "a-cb",    "target": "a-auth",  "status": "added"},
        {"id": "a5",  "source": "a-login", "target": "a-auth"},
        {"id": "a6",  "source": "a-auth",  "target": "a-jwt"},
        {"id": "a7",  "source": "a-auth",  "target": "a-user"},
        {"id": "a8",  "source": "a-jwt",   "target": "a-mw"},
        {"id": "a9",  "source": "a-mw",    "target": "a-apis"},
        {"id": "a10", "source": "a-user",  "target": "a-db"},
        {"id": "a11", "source": "a-dep",   "target": "a-auth",  "status": "added", "label": "import"},
    ],
}

SIM_CURRENT = {
    "nodes": [
        {"id": "s-login", "name": "Login",      "type": "api",      "x": 0, "y": 0,   "tech": "/auth/login"},
        {"id": "s-jwt",   "name": "JWT",        "type": "function", "x": 0, "y": 160, "tech": "jwt_service"},
        {"id": "s-mw",    "name": "Middleware", "type": "function", "x": 0, "y": 320, "tech": "middleware/jwt"},
        {"id": "s-apis",  "name": "APIs",       "type": "api",      "x": 0, "y": 480, "tech": "42 routes"},
    ],
    "edges": [
        {"id": "s1", "source": "s-login", "target": "s-jwt"},
        {"id": "s2", "source": "s-jwt",   "target": "s-mw"},
        {"id": "s3", "source": "s-mw",    "target": "s-apis"},
    ],
}

SIM_PROPOSED = {
    "nodes": [
        {"id": "p-oauth", "name": "Google OAuth",   "type": "external", "x": 0,    "y": 0,   "tech": "Google Identity",  "status": "added"},
        {"id": "p-auth",  "name": "Authentication", "type": "service",  "x": 0,    "y": 160, "tech": "auth/service.py",  "status": "modified"},
        {"id": "p-jwt",   "name": "JWT",            "type": "function", "x": -190, "y": 330, "tech": "jwt_service",      "status": "affected"},
        {"id": "p-of",    "name": "OAuth Flow",     "type": "service",  "x": 190,  "y": 330, "tech": "authlib client",   "status": "added"},
        {"id": "p-mw",    "name": "Middleware",     "type": "function", "x": 0,    "y": 500, "tech": "middleware/jwt",   "status": "affected"},
        {"id": "p-apis",  "name": "APIs",           "type": "api",      "x": 0,    "y": 660, "tech": "42 routes",       "status": "affected"},
    ],
    "edges": [
        {"id": "p1", "source": "p-oauth", "target": "p-auth", "status": "added"},
        {"id": "p2", "source": "p-auth",  "target": "p-jwt"},
        {"id": "p3", "source": "p-auth",  "target": "p-of",   "status": "added"},
        {"id": "p4", "source": "p-jwt",   "target": "p-mw"},
        {"id": "p5", "source": "p-of",    "target": "p-mw",   "status": "added"},
        {"id": "p6", "source": "p-mw",    "target": "p-apis"},
    ],
}

DEPENDENCIES = [
    {"name": "Flask",        "version": "3.1.0",  "status": "Healthy",            "usedBy": 18, "license": "BSD-3"},
    {"name": "SQLAlchemy",   "version": "2.0.41", "status": "Healthy",            "usedBy": 14, "license": "MIT"},
    {"name": "PyJWT",        "version": "2.8.0",  "status": "Healthy",            "usedBy": 3,  "license": "MIT"},
    {"name": "Requests",     "version": "2.32.0", "status": "Healthy",            "usedBy": 6,  "license": "Apache-2.0"},
    {"name": "Flask-CORS",   "version": "4.0.0",  "status": "Healthy",            "usedBy": 1,  "license": "MIT"},
    {"name": "Stripe",       "version": "7.4.0",  "status": "Update Recommended", "usedBy": 4,  "license": "MIT"},
    {"name": "Celery",       "version": "5.3.1",  "status": "Update Recommended", "usedBy": 5,  "license": "BSD-3"},
    {"name": "Pillow",       "version": "9.5.0",  "status": "Security Risk",      "usedBy": 2,  "license": "HPND"},
    {"name": "OldAuthLib",   "version": "2.1.0",  "status": "Review",             "usedBy": 0,  "license": "MIT"},
    {"name": "Cryptography", "version": "42.0.5", "status": "Healthy",            "usedBy": 3,  "license": "Apache-2.0"},
]

ENV_VARS = [
    {"name": "DATABASE_URL",   "required": True,  "usedBy": "db/session.py · models/*",  "status": "set",     "rotated": "41 days ago"},
    {"name": "SECRET_KEY",     "required": True,  "usedBy": "app.py",                    "status": "set",     "rotated": "180 days ago"},
    {"name": "JWT_SECRET",     "required": True,  "usedBy": "auth/jwt_service.py",       "status": "set",     "rotated": "96 days ago"},
    {"name": "EMAIL_API_KEY",  "required": True,  "usedBy": "services/email.py",         "status": "set",     "rotated": "64 days ago"},
    {"name": "OPENAI_API_KEY", "required": False, "usedBy": "services/suggest.py",       "status": "set",     "rotated": "12 days ago"},
    {"name": "STRIPE_KEY",     "required": True,  "usedBy": "services/payments.py",      "status": "set",     "rotated": "30 days ago"},
    {"name": "REDIS_URL",      "required": True,  "usedBy": "cache/client.py",           "status": "set",     "rotated": "200 days ago"},
    {"name": "SENTRY_DSN",     "required": False, "usedBy": "app.py",                    "status": "missing", "rotated": "—"},
]

SECURITY = {
    "score": 72,
    "high": 2, "medium": 5, "low": 8,
    "findings": [
        {"id": "SEC-01", "title": "JWT_SECRET rotation exceeds policy (96d)",  "severity": "High",   "area": "auth/jwt_service.py", "detail": "Signing key older than the 90-day rotation policy increases blast radius if leaked."},
        {"id": "SEC-02", "title": "Pillow 9.5.0 — known CVE-2023-50447",       "severity": "High",   "area": "requirements.txt",   "detail": "Image processing dependency with a published RCE advisory. Upgrade to ≥10.2."},
        {"id": "SEC-03", "title": "CORS allows wildcard origin in staging",    "severity": "Medium", "area": "app.py",             "detail": "Flask-CORS configured with * origin when DEBUG is true."},
        {"id": "SEC-04", "title": "Rate limiting missing on /auth/login",      "severity": "Medium", "area": "api/auth.py",        "detail": "Credential-stuffing exposure; suggest IP + account throttling."},
        {"id": "SEC-05", "title": "Password reset tokens not single-use",      "severity": "Medium", "area": "auth/service.py",    "detail": "Reset token remains valid after first use until expiry."},
        {"id": "SEC-06", "title": "Verbose error responses in Payments API",   "severity": "Low",    "area": "api/payments.py",    "detail": "Stack fragments returned on 5xx in non-debug mode."},
    ],
}

SECURITY_IMPACT = [
    {"title": "OAuth Callback Validation", "severity": "High",   "why": "The callback endpoint becomes an entry point for forged identity assertions. State parameter, nonce and redirect-URI allow-list validation are mandatory, or attackers can replay or intercept authorization codes."},
    {"title": "Account Linking",           "severity": "High",   "why": "Linking a Google account by email can silently hand over an existing account if the email is unverified or matchable across tenants. Require verified email claims and an explicit linking step for existing users."},
    {"title": "Token Lifecycle",           "severity": "Medium", "why": "OAuth-issued sessions must follow the same JWT expiry, refresh and revocation rules as password sessions. Divergence creates sessions that survive credential resets."},
    {"title": "Secret Configuration",      "severity": "Medium", "why": "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET become high-value secrets. They must live in environment configuration with rotation policy — never in the repository or client bundle."},
]

TEST_IMPACT = [
    {"area": "Authentication Tests", "level": "High",   "note": "Dual-provider sign-in matrix, account linking, provider mismatch."},
    {"area": "Login API Tests",      "level": "High",   "note": "Existing password flows must stay green; add /auth/google cases."},
    {"area": "JWT Tests",            "level": "High",   "note": "Claims parity between password and OAuth-issued tokens."},
    {"area": "Profile API Tests",    "level": "Medium", "note": "Profile reads for OAuth-linked users without a local password."},
    {"area": "Registration Tests",   "level": "Medium", "note": "Auto-provisioning on first Google sign-in."},
    {"area": "Order API Tests",      "level": "Low",    "note": "Indirect — order flows depend on session claims only."},
]

ENHANCE_QUESTIONS = [
    {"q": "Should the existing login remain?",          "a": "Yes — keep email/password sign-in as the default path."},
    {"q": "Should existing users be linked?",           "a": "Yes — link Google identity to existing accounts by verified email."},
    {"q": "Should JWT continue to be used?",            "a": "Yes — issue the same RS256 JWT for OAuth sessions."},
    {"q": "Should new users be created automatically?", "a": "Yes — auto-provision on first Google sign-in."},
    {"q": "Are new environment variables required?",    "a": "Yes — GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."},
    {"q": "Are there security considerations?",         "a": "Yes — callback validation, account-linking rules, token lifecycle."},
]

HISTORY = [
    {"id": "AN-1042", "name": "Google Authentication",    "risk": "High",   "score": 87, "blast": 18, "confidence": 91, "date": "Today · 14:32",   "change": "Add Google Login while keeping the existing authentication system."},
    {"id": "AN-1039", "name": "Payment Provider Upgrade", "risk": "Medium", "score": 54, "blast": 11, "confidence": 88, "date": "Feb 12 · 09:15",  "change": "Upgrade Stripe SDK from 7.4.0 to 8.1.2."},
    {"id": "AN-1031", "name": "User UUID Migration",      "risk": "High",   "score": 81, "blast": 34, "confidence": 76, "date": "Feb 03 · 17:48",  "change": "Migrate user primary keys from int to UUID."},
    {"id": "AN-1026", "name": "Email Service Change",     "risk": "Low",    "score": 23, "blast": 4,  "confidence": 95, "date": "Jan 27 · 11:02",  "change": "Replace SendGrid with AWS SES for transactional email."},
]

GITHUB_DIFF = [
    {"file": "src/auth/service.py",   "added": 62, "removed": 34, "status": "modified"},
    {"file": "src/auth/oauth.py",     "added": 98, "removed": 0,  "status": "added"},
    {"file": "src/middleware/jwt.py", "added": 18, "removed": 9,  "status": "modified"},
    {"file": "src/api/login.py",      "added": 12, "removed": 4,  "status": "modified"},
    {"file": "src/models/user.py",    "added": 9,  "removed": 3,  "status": "modified"},
    {"file": "config/env.py",         "added": 6,  "removed": 2,  "status": "modified"},
    {"file": "tests/test_auth.py",    "added": 33, "removed": 20, "status": "modified"},
    {"file": "requirements.txt",      "added": 3,  "removed": 2,  "status": "modified"},
]

DEP_COMPARE = [
    {"name": "Flask",      "before": "3.1.0",  "after": "3.1.0",  "status": "No Change"},
    {"name": "PyJWT",      "before": "2.8.0",  "after": "2.8.0",  "status": "No Change"},
    {"name": "Requests",   "before": "2.32.0", "after": "2.32.0", "status": "No Change"},
    {"name": "SQLAlchemy", "before": "2.0.41", "after": "2.0.43", "status": "Version Change"},
    {"name": "Authlib",    "before": "—",      "after": "1.3.2",  "status": "Added"},
    {"name": "OldAuthLib", "before": "2.1.0",  "after": "—",      "status": "Removed"},
]

MOCK_PR = {
    "number": 241,
    "title": "Add Google OAuth to auth service",
    "author": "d.park",
    "base": "main",
    "head": "feature/google-oauth",
    "summary": "This PR adds Google OAuth login, validates callback state, and preserves the existing session/JWT flow for protected routes.",
    "changedFiles": [
        "src/auth/service.py", "src/auth/oauth.py", "src/middleware/jwt.py",
        "src/api/login.py", "src/models/user.py", "config/env.py",
        "tests/test_auth.py", "requirements.txt",
    ],
    "affectedComponents": [
        "Auth service", "JWT middleware", "Login API", "User model", "Protected route guards",
    ],
    "dependencies": [
        {"name": "Authlib",    "impact": "Added OAuth provider library", "status": "new"},
        {"name": "PyJWT",      "impact": "Session claims must remain compatible with Google-issued identities", "status": "existing"},
        {"name": "SQLAlchemy", "impact": "User linking writes to local profile table", "status": "updated"},
    ],
    "tests": [
        "Auth login matrix: email/password vs Google OAuth",
        "Callback state validation and redirect URL checks",
        "JWT token parity for OAuth-linked sessions",
        "Protected endpoint access with linked Google accounts",
    ],
    "securityImpact": [
        "Callback validation needs state/nonce enforcement to prevent hijacked auth codes.",
        "Explicit account linking is required for existing users with verified email matches.",
        "JWT expiry and revocation rules must remain consistent across both providers.",
    ],
    "blastRadius": 18,
    "riskScore": 87,
    "confidence": 91,
    "report": "The change is concentrated in the auth stack, but it affects session validation and all protected endpoints. Risk is elevated because a mismatch in callback validation or claims mapping could create unauthorized access to sensitive APIs.",
}
