#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

pass() { echo "✅ $1"; PASS=$((PASS+1)); }
fail() { echo "❌ $1"; FAIL=$((FAIL+1)); }
warn() { echo "⚠️  $1"; }

# 1. Read pinned version
if [ ! -f .graphify-version ]; then
    fail ".graphify-version not found in repo root"
    echo ""; echo "Setup failed: $PASS passed, $FAIL failed"; exit 1
fi
GFY_VERSION=$(tr -d '[:space:]' < .graphify-version)
echo "Pinned graphify version: $GFY_VERSION"

# 2. Verify/install uv
if command -v uv >/dev/null 2>&1; then
    pass "uv is available ($(uv --version))"
else
    warn "uv not found — installing via official installer"
    curl -LsSf https://astral.sh/uv/install.sh | sh || { fail "uv install failed"; exit 1; }
    # shellcheck source=/dev/null
    source "$HOME/.cargo/env" 2>/dev/null || true
    command -v uv >/dev/null 2>&1 && pass "uv installed" || { fail "uv not on PATH after install"; exit 1; }
fi

# 3. Verify/install pinned graphify
INSTALLED_VERSION=""
if command -v graphify >/dev/null 2>&1; then
    INSTALLED_VERSION=$(graphify --version 2>/dev/null | awk '{print $2}' || echo "")
fi

if [ "$INSTALLED_VERSION" = "$GFY_VERSION" ]; then
    pass "graphify $GFY_VERSION already installed"
else
    echo "Installing graphifyy==$GFY_VERSION …"
    if uv tool install "graphifyy==$GFY_VERSION" 2>&1; then
        pass "graphify $GFY_VERSION installed"
    else
        fail "graphify install failed"
    fi
fi

# 4. Ensure graphify is on PATH
if ! command -v graphify >/dev/null 2>&1; then
    warn "graphify not on PATH — attempting uv tool update-shell"
    uv tool update-shell 2>/dev/null || true
    if command -v graphify >/dev/null 2>&1; then
        pass "graphify now on PATH"
    else
        fail "graphify not on PATH. Run: uv tool update-shell then open a new terminal"
    fi
else
    pass "graphify is on PATH"
fi

# 5. Verify/install post-commit hook
if [ -f .git/hooks/post-commit ] && grep -q "graphify-hook-start" .git/hooks/post-commit 2>/dev/null; then
    pass "post-commit hook present"
else
    echo "Installing graphify git hooks …"
    if GRAPHIFY_SKIP_HOOK=1 graphify hook install 2>&1; then
        pass "graphify git hooks installed"
    else
        fail "graphify hook install failed"
    fi
fi

# 6. Verify post-checkout hook
if [ -f .git/hooks/post-checkout ] && grep -q "graphify-checkout-hook-start" .git/hooks/post-checkout 2>/dev/null; then
    pass "post-checkout hook present"
else
    fail "post-checkout hook missing — run: graphify hook install"
fi

# 7. Create .graphify/context/ directory
mkdir -p .graphify/context
pass ".graphify/context/ ready"

# 8. Build initial graph if missing
if [ -f graphify-out/graph.json ]; then
    pass "graphify-out/graph.json exists"
else
    echo "Building initial graph (code-only, no API key needed) …"
    if GRAPHIFY_SKIP_HOOK=1 graphify . --code-only 2>&1; then
        pass "Initial graph built"
    else
        fail "Initial graph build failed — see output above"
    fi
fi

# 9. Verify Claude Code hook scripts are referenced in .claude/settings.json
if [ -f .claude/settings.json ]; then
    if grep -q "graphify-user-prompt-hook" .claude/settings.json && \
       grep -q "graphify-hook-guard" .claude/settings.json; then
        pass ".claude/settings.json references graphify hook scripts"
    else
        fail ".claude/settings.json does not reference graphify hook scripts"
        warn "Update .claude/settings.json or re-run: graphify install --project"
    fi
else
    fail ".claude/settings.json not found — run: graphify install --project"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup complete: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
