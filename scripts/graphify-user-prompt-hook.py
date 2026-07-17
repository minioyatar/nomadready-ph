#!/usr/bin/env python3
"""
Claude Code UserPromptSubmit hook.

Reads snake_case JSON from stdin per the Claude Code hook spec.
Writes hookSpecificOutput JSON to stdout if context should be injected.
Always exits 0 (Stage 1: never blocks).
"""
import json
import os
import sys
import time
from pathlib import Path

# Allow import of shared module regardless of CWD
sys.path.insert(0, str(Path(__file__).parent))

from graphify_common import (
    BRANCH_PATTERN,
    current_branch,
    generate_context_report,
    load_graph,
)

GRAPH_PATH = Path("graphify-out/graph.json")


def emit_response(additional_context: str = ""):
    """Write the Claude Code UserPromptSubmit response schema to stdout."""
    resp = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": additional_context,
        }
    }
    print(json.dumps(resp))


def main():
    # Skip immediately when called recursively from our own graphify subprocesses
    if os.environ.get("GRAPHIFY_SKIP_HOOK") == "1":
        sys.exit(0)

    # Parse stdin — snake_case per Claude Code spec
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            sys.exit(0)
        payload = json.loads(raw)
    except Exception:
        # Malformed input — pass through silently
        sys.exit(0)

    prompt = payload.get("prompt", "")
    if not prompt or not prompt.strip():
        sys.exit(0)

    branch = current_branch()
    if not branch or branch == "main" or not BRANCH_PATTERN.match(branch):
        sys.exit(0)

    # Generate or reuse context (never blocks — catch all exceptions)
    try:
        generated, report_path, message = generate_context_report(
            branch=branch,
            task_text=prompt,
            force=False,
        )

        if not Path(report_path).exists():
            emit_response(f"⚠️ Graphify context generation failed: {message}")
            sys.exit(0)

        content = Path(report_path).read_text()
        action = "Generated" if generated else "Reusing"
        header = f"<!-- Graphify Context ({action}: {Path(report_path).name}) -->\n\n"
        emit_response(header + content)

    except Exception as exc:
        # Never crash Claude — emit warning and continue
        emit_response(f"⚠️ Graphify context hook error: {exc}")

    sys.exit(0)


if __name__ == "__main__":
    main()
