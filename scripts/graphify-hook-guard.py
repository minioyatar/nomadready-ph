#!/usr/bin/env python3
"""
Claude Code PreToolUse guard — Stage 1: warn only, never block.

Called by Claude Code before Bash, Read, Glob, Edit, Write tool calls.
Exits 0 always in Stage 1 (no exit 2 blocking).
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from graphify_common import (
    BRANCH_PATTERN,
    branch_slug,
    current_branch,
    graph_is_valid,
    read_report_meta,
    installed_graphify_version,
    pinned_version,
)

GRAPH_PATH = Path("graphify-out/graph.json")


def warn(msg: str):
    print(f"⚠️  [graphify-hook-guard] {msg}", file=sys.stderr)


def main():
    # Skip when called from our own graphify scripts
    if os.environ.get("GRAPHIFY_SKIP_HOOK") == "1":
        sys.exit(0)

    branch = current_branch()
    if not branch or branch == "main" or not BRANCH_PATTERN.match(branch):
        sys.exit(0)

    # Check graph exists
    if not GRAPH_PATH.exists():
        warn("No graph found. Run: graphify . --code-only")
        sys.exit(0)

    # Check graph validity
    is_valid, reason = graph_is_valid(GRAPH_PATH, branch)
    if not is_valid:
        warn(f"Graph may be outdated: {reason}. Run: graphify update . --code-only")
        sys.exit(0)

    # Check context report
    slug = branch_slug(branch)
    report_path = Path(".graphify/context") / f"{slug}.md"

    if not report_path.exists():
        warn(
            f"No context report for branch '{branch}'.\n"
            "  The UserPromptSubmit hook should generate it automatically on the next prompt.\n"
            "  Or run manually: python scripts/graphify-feature-context.py --task '<task>'"
        )
        # Stage 1: always allow
        sys.exit(0)

    # Report exists — check metadata for major staleness signals
    meta = read_report_meta(report_path)
    if meta:
        current_version = pinned_version() or installed_graphify_version()
        if current_version and meta.get("graphify_version") != current_version:
            warn(f"Context report was generated with graphify {meta.get('graphify_version')}, "
                 f"current is {current_version}. Consider: python scripts/graphify-feature-context.py "
                 f"--task '<original task>' --force")

    # Stage 1: always allow the tool
    sys.exit(0)


if __name__ == "__main__":
    main()
