#!/usr/bin/env bash
# Sets up the Graphify local architecture map for NomadReady PH.
# Graphify is an optional advisory tool — it does not gate commits or CI.
set -euo pipefail

PASS=0
FAIL=0

pass() { echo "✅ $1"; PASS=$((PASS+1)); }
fail() { echo "❌ $1"; FAIL=$((FAIL+1)); }

# 1. Read pinned version
if [ ! -f .graphify-version ]; then
    fail ".graphify-version not found in repo root"
    exit 1
fi
GFY_VERSION=$(tr -d '[:space:]' < .graphify-version)
echo "Pinned graphify version: $GFY_VERSION"

# 2. Ensure uv is available
if command -v uv >/dev/null 2>&1; then
    pass "uv is available ($(uv --version))"
else
    echo "Installing uv …"
    curl -LsSf https://astral.sh/uv/install.sh | sh || { fail "uv install failed"; exit 1; }
    # shellcheck source=/dev/null
    source "$HOME/.cargo/env" 2>/dev/null || true
    command -v uv >/dev/null 2>&1 && pass "uv installed" || { fail "uv not on PATH after install"; exit 1; }
fi

# 3. Install exact pinned Graphify version
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
        fail "graphify install failed"; exit 1
    fi
fi

# 4. Verify graphify command works
if ! command -v graphify >/dev/null 2>&1; then
    uv tool update-shell 2>/dev/null || true
fi
if graphify --version >/dev/null 2>&1; then
    pass "graphify command works ($(graphify --version))"
else
    fail "graphify not executable — run: uv tool update-shell then open a new terminal"
    exit 1
fi

# 5. Install official Graphify git hooks (post-commit + post-checkout)
# These are Graphify's standard hooks that rebuild the local map after commits.
# A hook failure does not undo the commit.
if GRAPHIFY_SKIP_HOOK=1 graphify hook install 2>&1; then
    pass "graphify git hooks installed (post-commit, post-checkout)"
else
    fail "graphify hook install failed"
fi

# 6. Build initial local graph
if [ -f graphify-out/graph.json ]; then
    pass "graphify-out/graph.json exists"
else
    echo "Building initial local graph (code-only, no API key needed) …"
    if GRAPHIFY_SKIP_HOOK=1 graphify . --code-only 2>&1; then
        pass "Initial graph built"
    else
        fail "Initial graph build failed — see output above"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup complete: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Optional Graphify queries (advisory only):"
echo "  graphify query \"where is lgu_verified enforced\""
echo "  graphify path \"Listing\" \"ScoreSnapshot\""
echo "  graphify explain \"calculate_destination_score\""
echo "  graphify update .   # manual map rebuild (post-commit hook does this automatically)"
echo ""
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
