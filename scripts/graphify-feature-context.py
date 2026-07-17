#!/usr/bin/env python3
"""Manual feature context generator.

Usage:
  python scripts/graphify-feature-context.py --task "add scoring filter" [--key "calculate_destination_score"] [--force]
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from graphify_common import (
    current_branch, BRANCH_PATTERN, generate_context_report
)


def main():
    parser = argparse.ArgumentParser(description="Generate Graphify feature context report")
    parser.add_argument("--task", required=True, help="Task description")
    parser.add_argument("--key", default=None, help="Key graph node label (optional)")
    parser.add_argument("--force", action="store_true", help="Force regeneration")
    parser.add_argument("--branch", default=None, help="Override branch name")
    args = parser.parse_args()

    branch = args.branch or current_branch()
    if not branch:
        print("ERROR: Could not detect current branch.", file=sys.stderr)
        sys.exit(1)

    if branch == "main" or not BRANCH_PATTERN.match(branch):
        print(f"Branch '{branch}' is not a feature/fix/chore branch. Skipping context generation.")
        sys.exit(0)

    generated, report_path, message = generate_context_report(
        branch=branch,
        task_text=args.task,
        key_node=args.key,
        force=args.force,
    )

    status = "Generated" if generated else "Reused"
    print(f"{status}: {report_path}")
    print(message)
    sys.exit(0)


if __name__ == "__main__":
    main()
