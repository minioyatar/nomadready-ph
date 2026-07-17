#!/usr/bin/env python3
"""
Graphify blast-radius analysis for GitHub Actions.

Reads structured graph.json from head and base checkouts.
Outputs Markdown to GITHUB_STEP_SUMMARY and /tmp/graphify-blast-radius-report.md.
Posts/updates a PR comment with sentinel <!-- graphify-blast-radius -->.
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque
from pathlib import Path
from typing import Optional

# ── Configuration ──────────────────────────────────────────────────────────
REPO          = os.environ.get("REPO", "")
GH_TOKEN      = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN", "")
PR_NUMBER     = os.environ.get("PR_NUMBER", "")
BASE_BRANCH   = os.environ.get("BASE_BRANCH", "main")
HEAD_SHA      = os.environ.get("HEAD_SHA", "")
BASE_SHA      = os.environ.get("BASE_SHA", "")
GFY_VERSION   = os.environ.get("GRAPHIFY_VERSION", "")
REPORT_PATH   = Path("/tmp/graphify-blast-radius-report.md")
SENTINEL      = "<!-- graphify-blast-radius -->"
TIME_BUDGET   = 120.0  # seconds for all graphify path calls
HOP_LIMIT     = 3
SKIP_ENV      = {**os.environ, "GRAPHIFY_SKIP_HOOK": "1"}

# Layer classification by file prefix
LAYER_MAP = [
    (r"backend/apps/\w+/models\.py",          "Model"),
    (r"backend/apps/scoring/services\.py",     "Scoring Engine"),
    (r"backend/apps/\w+/serializers\.py",      "Serializer"),
    (r"backend/apps/\w+/views\.py",            "View / API"),
    (r"backend/apps/\w+/tests?\.py",           "Tests"),
    (r"backend/apps/\w+/migrations/",          "Migration"),
    (r"frontend/src/",                         "Frontend"),
]


def classify_layer(file_path: str) -> str:
    for pattern, layer in LAYER_MAP:
        if re.search(pattern, file_path):
            return layer
    return "Other"


def is_test_file(file_path: str) -> bool:
    return bool(re.search(r"tests?\.py$|test_\w+\.py$", file_path))


# ── Graph loading ───────────────────────────────────────────────────────────

def load_graph(path: Path) -> Optional[dict]:
    try:
        with open(path) as f:
            g = json.load(f)
        assert "nodes" in g and "links" in g and "built_at_commit" in g
        return g
    except Exception as e:
        print(f"[blast-radius] Failed to load {path}: {e}", file=sys.stderr)
        return None


def build_adjacency(graph: dict):
    """
    Returns (forward_adj, reverse_adj).
    forward: node_id → list of {target, relation, confidence}
    reverse: node_id → list of {source, relation, confidence}
    """
    fwd = defaultdict(list)
    rev = defaultdict(list)
    for link in graph["links"]:
        src, tgt = link["source"], link["target"]
        rel, conf = link["relation"], link["confidence"]
        fwd[src].append({"node": tgt, "relation": rel, "confidence": conf})
        rev[tgt].append({"node": src, "relation": rel, "confidence": conf})
    return fwd, rev


def node_degree(graph: dict) -> dict[str, int]:
    deg = defaultdict(int)
    for link in graph["links"]:
        deg[link["source"]] += 1
        deg[link["target"]] += 1
    return deg


def nodes_by_file(graph: dict, file_path: str) -> list[dict]:
    return [n for n in graph["nodes"] if n.get("source_file") == file_path]


# ── Changed files ───────────────────────────────────────────────────────────

def get_changed_files(base_branch: str) -> dict:
    """
    Returns dict with keys: added, modified, deleted, renamed.
    renamed entries are (old_path, new_path) tuples.
    """
    r = subprocess.run(
        ["git", "diff", "--diff-filter=ADMR", "--name-status",
         f"origin/{base_branch}...HEAD"],
        capture_output=True, text=True
    )
    changed = {"added": [], "modified": [], "deleted": [], "renamed": []}
    for line in r.stdout.splitlines():
        parts = line.split("\t")
        if not parts:
            continue
        status = parts[0]
        if status == "A" and len(parts) >= 2:
            changed["added"].append(parts[1])
        elif status == "M" and len(parts) >= 2:
            changed["modified"].append(parts[1])
        elif status == "D" and len(parts) >= 2:
            changed["deleted"].append(parts[1])
        elif status.startswith("R") and len(parts) >= 3:
            changed["renamed"].append((parts[1], parts[2]))
    return changed


# ── Base graph via worktree ─────────────────────────────────────────────────

def build_base_graph(base_sha: str) -> Optional[dict]:
    worktree_path = Path("/tmp/gfy-base-worktree")
    graph_path = worktree_path / "graphify-out" / "graph.json"
    try:
        if worktree_path.exists():
            subprocess.run(["git", "worktree", "remove", "--force", str(worktree_path)],
                           capture_output=True)
        subprocess.run(
            ["git", "worktree", "add", "--detach", str(worktree_path), base_sha],
            check=True, capture_output=True
        )
        r = subprocess.run(
            ["graphify", ".", "--code-only"],
            capture_output=True, text=True, cwd=str(worktree_path),
            env=SKIP_ENV, timeout=300
        )
        if r.returncode != 0:
            print(f"[blast-radius] Base graph build stderr: {r.stderr[:500]}", file=sys.stderr)
            return None
        return load_graph(graph_path)
    except Exception as e:
        print(f"[blast-radius] Base graph build failed: {e}", file=sys.stderr)
        return None
    finally:
        subprocess.run(["git", "worktree", "remove", "--force", str(worktree_path)],
                       capture_output=True)


# ── BFS downstream (incoming edges = dependents) ────────────────────────────

def bfs_dependents(start_ids: list[str], rev_adj: dict,
                   max_hops: int = HOP_LIMIT, time_limit: float = 30.0) -> dict[str, int]:
    """
    BFS following INCOMING edges (reverse adjacency) to find what depends on start_ids.
    Returns {node_id: hop_distance}.
    """
    visited: dict[str, int] = {}
    queue = deque()
    for sid in start_ids:
        queue.append((sid, 0))
        visited[sid] = 0

    deadline = time.monotonic() + time_limit
    while queue:
        if time.monotonic() > deadline:
            break
        nid, hops = queue.popleft()
        if hops >= max_hops:
            continue
        for dep in rev_adj.get(nid, []):
            dep_id = dep["node"]
            if dep_id not in visited:
                visited[dep_id] = hops + 1
                queue.append((dep_id, hops + 1))
    return visited


# ── Risk ranking ─────────────────────────────────────────────────────────────

def risk_score(node: dict, hop: int, deg: dict[str, int], changed_layers: set[str]) -> int:
    score = 0
    score += deg.get(node["id"], 0) * 2
    layer = classify_layer(node.get("source_file", ""))
    if layer not in changed_layers:
        score += 10  # cross-layer
    if is_test_file(node.get("source_file", "")):
        score += 15
    if hop == 1:
        score += 5
    return score


# ── graphify path ────────────────────────────────────────────────────────────

def run_path(label_a: str, label_b: str, timeout: int = 30) -> tuple[bool, str]:
    r = subprocess.run(
        ["graphify", "path", label_a, label_b],
        capture_output=True, text=True,
        env=SKIP_ENV, timeout=timeout
    )
    return r.returncode == 0, r.stdout.strip()


# ── Report publishing ────────────────────────────────────────────────────────

def write_step_summary(content: str):
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        try:
            with open(summary_path, "a") as f:
                f.write(content + "\n")
        except Exception as e:
            print(f"[blast-radius] Step summary write failed: {e}", file=sys.stderr)


def upsert_pr_comment(body: str):
    """Update existing sentinel comment or create new one. Failures are warnings only."""
    if not GH_TOKEN or not REPO or not PR_NUMBER:
        print("[blast-radius] Skipping PR comment: missing token, repo, or PR number", file=sys.stderr)
        return

    headers = {
        "Authorization": f"token {GH_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }

    def api_request(method: str, url: str, data: Optional[dict] = None) -> dict:
        payload = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())

    try:
        # Find existing sentinel comment
        page = 1
        existing_id = None
        while True:
            url = f"https://api.github.com/repos/{REPO}/issues/{PR_NUMBER}/comments?per_page=100&page={page}"
            comments = api_request("GET", url)
            for c in comments:
                if SENTINEL in c.get("body", ""):
                    existing_id = c["id"]
                    break
            if existing_id or len(comments) < 100:
                break
            page += 1

        if existing_id:
            url = f"https://api.github.com/repos/{REPO}/issues/comments/{existing_id}"
            api_request("PATCH", url, {"body": body})
            print(f"[blast-radius] Updated PR comment #{existing_id}")
        else:
            url = f"https://api.github.com/repos/{REPO}/issues/{PR_NUMBER}/comments"
            result = api_request("POST", url, {"body": body})
            print(f"[blast-radius] Created PR comment #{result.get('id')}")

    except urllib.error.HTTPError as e:
        print(f"[blast-radius] ⚠️ PR comment failed ({e.code}): report in summary and artifact", file=sys.stderr)
    except Exception as e:
        print(f"[blast-radius] ⚠️ PR comment error: {e}: report in summary and artifact", file=sys.stderr)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    start_time = time.monotonic()
    print("[blast-radius] Loading head graph …")
    head_graph = load_graph(Path("graphify-out/graph.json"))
    if head_graph is None:
        print("[blast-radius] ERROR: Head graph unavailable.", file=sys.stderr)
        sys.exit(1)

    head_graph_commit = head_graph.get("built_at_commit", "unknown")

    print(f"[blast-radius] Building base graph at {BASE_SHA[:8] if BASE_SHA else 'unknown'} …")
    base_graph = build_base_graph(BASE_SHA) if BASE_SHA else None
    base_graph_commit = (base_graph or {}).get("built_at_commit", "N/A")
    if base_graph is None:
        print("[blast-radius] ⚠️ Base graph unavailable — deleted nodes will use head graph", file=sys.stderr)

    changed = get_changed_files(BASE_BRANCH)
    total_changed = (len(changed["added"]) + len(changed["modified"]) +
                     len(changed["deleted"]) + len(changed["renamed"]))

    if total_changed == 0:
        report = f"## Graphify Blast Radius — PR #{PR_NUMBER}\n\nNo code files changed.\n\n{SENTINEL}"
        REPORT_PATH.write_text(report)
        write_step_summary(report)
        upsert_pr_comment(report)
        return

    # Build head adjacency
    _, rev_adj_head = build_adjacency(head_graph)
    deg_head = node_degree(head_graph)

    # Identify changed nodes and their layers
    changed_nodes: list[dict] = []        # from head graph
    deleted_nodes: list[dict] = []        # from base graph
    changed_file_rows: list[str] = []
    changed_layers: set[str] = set()

    def add_changed_file(status: str, file_path: str, graph: dict, node_list: list):
        layer = classify_layer(file_path)
        changed_layers.add(layer)
        nodes = nodes_by_file(graph, file_path)
        node_list.extend(nodes)
        changed_file_rows.append(f"| {status} | `{file_path}` | {layer} |")

    for f in changed["added"]:
        add_changed_file("A", f, head_graph, changed_nodes)
    for f in changed["modified"]:
        add_changed_file("M", f, head_graph, changed_nodes)
    for f in changed["deleted"]:
        g = base_graph if base_graph else head_graph
        add_changed_file("D", f, g, deleted_nodes)
    for old_f, new_f in changed["renamed"]:
        g_old = base_graph if base_graph else head_graph
        add_changed_file("R (from)", old_f, g_old, deleted_nodes)
        add_changed_file("R (to)", new_f, head_graph, changed_nodes)

    all_changed_nodes = changed_nodes + deleted_nodes
    all_changed_ids = {n["id"] for n in all_changed_nodes}

    # ── Priority 1: Direct dependents ───────────────────────────────────────
    direct_deps: list[tuple[dict, dict, str, str]] = []  # (dep_node, via_changed_node, relation, confidence)
    for changed_node in all_changed_nodes:
        for dep in rev_adj_head.get(changed_node["id"], []):
            dep_id = dep["node"]
            if dep_id in all_changed_ids:
                continue
            dep_nodes = [n for n in head_graph["nodes"] if n["id"] == dep_id]
            if dep_nodes:
                direct_deps.append((dep_nodes[0], changed_node, dep["relation"], dep["confidence"]))

    # ── Priority 2: BFS incoming edges ≤3 hops ──────────────────────────────
    bfs_time_limit = min(30.0, (TIME_BUDGET - (time.monotonic() - start_time)) * 0.3)
    reachable = bfs_dependents(
        list(all_changed_ids), rev_adj_head,
        max_hops=HOP_LIMIT, time_limit=bfs_time_limit
    )
    reachable_nodes = [
        n for n in head_graph["nodes"]
        if n["id"] in reachable and n["id"] not in all_changed_ids
    ]

    # ── Priority 3: Affected tests ───────────────────────────────────────────
    affected_tests = [n for n in reachable_nodes if is_test_file(n.get("source_file", ""))]

    # ── Priority 4: Cross-layer dependents ───────────────────────────────────
    cross_layer_nodes = [
        n for n in reachable_nodes
        if classify_layer(n.get("source_file", "")) not in changed_layers
        and not is_test_file(n.get("source_file", ""))
    ]

    # ── Priority 5: God nodes fallback ───────────────────────────────────────
    all_candidates = direct_deps[:] if direct_deps else []
    candidate_ids = {d[0]["id"] for d in all_candidates}

    # Add high-ranked reachable nodes not already in candidates
    ranked_reachable = sorted(
        reachable_nodes,
        key=lambda n: -risk_score(n, reachable.get(n["id"], HOP_LIMIT), deg_head, changed_layers)
    )
    for n in ranked_reachable:
        if n["id"] not in candidate_ids and n["id"] not in all_changed_ids:
            candidate_ids.add(n["id"])

    # God nodes fallback (only if needed)
    if len(candidate_ids) < 3:
        god_nodes = sorted(head_graph["nodes"], key=lambda n: -deg_head.get(n["id"], 0))[:10]
        for n in god_nodes:
            if n["id"] not in candidate_ids and n["id"] not in all_changed_ids:
                candidate_ids.add(n["id"])

    # ── graphify path calls ──────────────────────────────────────────────────
    path_results: list[tuple[str, str, bool, str]] = []
    skipped_pairs: list[tuple[str, str, str]] = []

    # Build label lookup
    id_to_node = {n["id"]: n for n in head_graph["nodes"]}
    candidate_node_list = [id_to_node[nid] for nid in candidate_ids if nid in id_to_node]
    candidate_node_list.sort(
        key=lambda n: -risk_score(n, reachable.get(n["id"], HOP_LIMIT), deg_head, changed_layers)
    )

    for changed_node in all_changed_nodes:
        changed_label = changed_node.get("label", "")
        if not changed_label:
            continue
        for cand_node in candidate_node_list[:12]:
            cand_label = cand_node.get("label", "")
            if not cand_label or cand_label == changed_label:
                continue
            elapsed = time.monotonic() - start_time
            if elapsed > TIME_BUDGET - 5:
                skipped_pairs.append((changed_label, cand_label, "time budget exceeded"))
                continue
            try:
                found, output = run_path(changed_label, cand_label, timeout=25)
                path_results.append((changed_label, cand_label, found, output))
            except subprocess.TimeoutExpired:
                skipped_pairs.append((changed_label, cand_label, "path query timed out (25s)"))

    # ── Build report ─────────────────────────────────────────────────────────
    elapsed_total = time.monotonic() - start_time
    lines = [
        f"## Graphify Blast Radius — PR #{PR_NUMBER}",
        "",
        f"> Graph: {len(head_graph['nodes'])} nodes · {len(head_graph['links'])} edges "
        f"· head `{head_graph_commit[:8]}` · base `{base_graph_commit[:8]}`  ",
        f"> Graphify {GFY_VERSION} · Analysis time: {elapsed_total:.1f}s",
        "",
    ]

    # HIGH-RISK WARNINGS FIRST
    warnings: list[str] = []
    # Changed model/serializer with no test in PR
    for cn in all_changed_nodes:
        layer = classify_layer(cn.get("source_file", ""))
        if layer in ("Model", "Serializer", "Scoring Engine"):
            has_test_change = any(
                is_test_file(f) for f in (changed["added"] + changed["modified"])
            )
            if not has_test_change:
                warnings.append(
                    f"⚠️ `{cn.get('label', cn.get('source_file', '?'))}` ({layer}) changed "
                    f"with no test file in this PR."
                )
    # Cross-layer dependents without tests
    for n in cross_layer_nodes[:5]:
        warnings.append(
            f"⚠️ `{n.get('label', '?')}` ({classify_layer(n.get('source_file', ''))}) "
            f"is a cross-layer dependent — verify it is still correct."
        )

    if warnings:
        lines += ["### ⚠️ High-Risk Warnings", ""] + warnings + [""]

    # Changed files table
    lines += [
        f"### Changed files ({total_changed})",
        "",
        "| Status | File | Layer |",
        "|---|---|---|",
    ] + changed_file_rows + [""]

    # Direct dependents
    if direct_deps:
        lines += [
            "### Direct dependents (Priority 1)",
            "",
            "| Changed node | Depended on by | Relation | Confidence |",
            "|---|---|---|---|",
        ]
        seen = set()
        for dep_node, via_node, rel, conf in direct_deps:
            key = (via_node.get("label", "?"), dep_node.get("label", "?"))
            if key in seen:
                continue
            seen.add(key)
            lines.append(
                f"| `{via_node.get('label', '?')}` | `{dep_node.get('label', '?')}` "
                f"| {rel} | {conf} |"
            )
        lines.append("")

    # Confirmed paths
    found_paths = [(a, b, o) for a, b, found, o in path_results if found]
    not_found_paths = [(a, b) for a, b, found, o in path_results if not found]

    if found_paths:
        lines += ["### Confirmed paths", ""]
        for a, b, output in found_paths[:8]:  # cap display at 8
            lines.append(f"**`{a}` → `{b}`**")
            lines.append(f"```\n{output}\n```")
            lines.append("")

    if not_found_paths:
        lines += ["### No direct path found", ""]
        for a, b in not_found_paths[:5]:
            lines.append(f"- `{a}` → `{b}` — no path (may be correctly isolated)")
        lines.append("")

    # Affected tests
    if affected_tests:
        lines += ["### Likely affected tests", ""]
        for n in affected_tests[:10]:
            lines.append(f"- `{n.get('source_file', '?')}`")
        lines.append("")

    # Cross-layer blast radius table
    if cross_layer_nodes or changed_layers:
        lines += [
            "### Cross-layer blast radius",
            "",
            "| Changed layer | Downstream layer | In this PR? |",
            "|---|---|---|",
        ]
        shown = set()
        for n in cross_layer_nodes[:10]:
            dl = classify_layer(n.get("source_file", ""))
            for cl in changed_layers:
                key = (cl, dl)
                if key not in shown:
                    shown.add(key)
                    in_pr = "✅ yes" if any(
                        classify_layer(f) == dl
                        for f in (changed["added"] + changed["modified"])
                    ) else "⚠️ no"
                    lines.append(f"| {cl} | {dl} | {in_pr} |")
        lines.append("")

    # Skipped nodes
    if skipped_pairs:
        lines += [
            f"### Skipped ({len(skipped_pairs)} pairs)",
            "",
            "| From | To | Reason |",
            "|---|---|---|",
        ]
        for a, b, reason in skipped_pairs[:10]:
            lines.append(f"| `{a}` | `{b}` | {reason} |")
        lines.append("")

    lines += [
        "---",
        f"*Graphify {GFY_VERSION} · head `{head_graph_commit[:8]}` · "
        f"base `{base_graph_commit[:8]}` · {elapsed_total:.1f}s*",
        "",
        SENTINEL,
    ]

    report = "\n".join(lines)

    # Write artifact
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report)
    print(f"[blast-radius] Report written to {REPORT_PATH}")

    # Step summary
    write_step_summary(report)

    # PR comment (best-effort — failure is warning only)
    upsert_pr_comment(report)


if __name__ == "__main__":
    main()
