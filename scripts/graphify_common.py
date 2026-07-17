"""Shared Graphify workflow utilities."""
import fcntl
import hashlib
import json
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Optional


BRANCH_PATTERN = re.compile(r'^(feature|fix|chore)/')
GRAPHIFY_SKIP_ENV = {"GRAPHIFY_SKIP_HOOK": "1"}


# ---------------------------------------------------------------------------
# Branch helpers
# ---------------------------------------------------------------------------

def current_branch() -> str:
    r = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True, text=True
    )
    return r.stdout.strip()


def branch_slug(branch: str) -> str:
    """feature/foo-bar → feature-foo-bar"""
    slug = re.sub(r'[^a-zA-Z0-9-]', '-', branch)
    slug = re.sub(r'-{2,}', '-', slug).strip('-').lower()
    return slug


def branch_base_commit(branch: str) -> str:
    """SHA of merge-base with origin/main."""
    r = subprocess.run(
        ["git", "merge-base", "HEAD", "origin/main"],
        capture_output=True, text=True
    )
    return r.stdout.strip()


def commit_in_history(commit_sha: str) -> bool:
    """True if commit_sha is an ancestor of HEAD."""
    r = subprocess.run(
        ["git", "merge-base", "--is-ancestor", commit_sha, "HEAD"],
        capture_output=True
    )
    return r.returncode == 0


# ---------------------------------------------------------------------------
# Graph helpers
# ---------------------------------------------------------------------------

def load_graph(graph_path: Path) -> Optional[dict]:
    """Load and validate graph.json. Returns None on any failure."""
    try:
        with open(graph_path) as f:
            g = json.load(f)
        assert "nodes" in g and "links" in g and "built_at_commit" in g
        return g
    except Exception:
        return None


def graph_built_at_commit(graph: dict) -> str:
    return graph.get("built_at_commit", "")


def pinned_version() -> str:
    p = Path(".graphify-version")
    if p.exists():
        return p.read_text().strip()
    return ""


def installed_graphify_version() -> str:
    r = subprocess.run(["graphify", "--version"], capture_output=True, text=True)
    # "graphify 0.9.17" → "0.9.17"
    parts = r.stdout.strip().split()
    return parts[1] if len(parts) == 2 else ""


def build_graph_code_only(cwd: Path = Path(".")) -> bool:
    """Run graphify . --code-only. Returns True on success."""
    env = {**os.environ, **GRAPHIFY_SKIP_ENV}
    r = subprocess.run(
        ["graphify", ".", "--code-only"],
        capture_output=True, text=True,
        cwd=str(cwd), env=env, timeout=300
    )
    return r.returncode == 0


# ---------------------------------------------------------------------------
# Graph freshness
# ---------------------------------------------------------------------------

def graph_is_valid(graph_path: Path, branch: str) -> tuple[bool, str]:
    """
    Returns (is_valid, reason).
    Valid = JSON loads, has built_at_commit, commit is in branch history,
            commit is not older than branch base.
    Does NOT declare stale merely because HEAD advanced after implementation commits.
    """
    g = load_graph(graph_path)
    if g is None:
        return False, "graph.json missing or invalid JSON"

    graph_commit = graph_built_at_commit(g)
    if not graph_commit:
        return False, "built_at_commit missing from graph.json"

    if not commit_in_history(graph_commit):
        return False, f"graph built at {graph_commit[:8]} which is not in current branch history"

    base = branch_base_commit(branch)
    if base:
        # Check graph_commit is not *older than* base — i.e., base must be an ancestor of graph_commit
        r = subprocess.run(
            ["git", "merge-base", "--is-ancestor", graph_commit, base],
            capture_output=True
        )
        # if graph_commit IS an ancestor of base, graph predates the branch
        if r.returncode == 0 and graph_commit != base:
            return False, f"graph built at {graph_commit[:8]} predates branch base {base[:8]}"

    return True, "ok"


# ---------------------------------------------------------------------------
# Context report metadata
# ---------------------------------------------------------------------------

def task_hash(task_text: str) -> str:
    return hashlib.sha256(task_text.strip().lower().encode()).hexdigest()[:12]


def read_report_meta(report_path: Path) -> Optional[dict]:
    """Parse YAML front-matter from context report. Returns None if absent/invalid."""
    try:
        text = report_path.read_text()
        if not text.startswith("---"):
            return None
        end = text.index("---", 3)
        yaml_block = text[3:end].strip()
        meta = {}
        for line in yaml_block.splitlines():
            if ":" in line:
                k, _, v = line.partition(":")
                meta[k.strip()] = v.strip()
        return meta
    except Exception:
        return None


def should_regenerate(report_path: Path, branch: str, task_text: str,
                       graph: Optional[dict], force: bool = False) -> tuple[bool, str]:
    """
    Returns (should_regen, reason).
    Regenerate only on the specified conditions — NOT merely because HEAD advanced.
    """
    if force:
        return True, "--force requested"
    if not report_path.exists():
        return True, "no context report for this branch"

    meta = read_report_meta(report_path)
    if meta is None:
        return True, "context report has no parseable front-matter"

    if meta.get("branch") != branch:
        return True, f"report is for branch '{meta.get('branch')}', current is '{branch}'"

    # base commit — rebase detection
    current_base = branch_base_commit(branch)
    if current_base and meta.get("base_commit") and meta["base_commit"] != current_base:
        return True, f"branch base changed (rebase detected): {meta['base_commit'][:8]} → {current_base[:8]}"

    # graphify version
    current_version = pinned_version() or installed_graphify_version()
    if current_version and meta.get("graphify_version") != current_version:
        return True, f"graphify version changed: {meta.get('graphify_version')} → {current_version}"

    # graph validity
    if graph is None:
        return True, "graph.json missing or invalid"
    graph_commit = graph_built_at_commit(graph)
    if meta.get("graph_commit") != graph_commit:
        return True, f"graph rebuilt since report: {meta.get('graph_commit', '?')[:8]} → {graph_commit[:8]}"

    # NOTE: we do NOT regenerate because HEAD advanced after implementation commits.
    # The original task hash is stored; later prompts on the same branch reuse the report.
    return False, "report is current"


# ---------------------------------------------------------------------------
# Node inference from graph.json
# ---------------------------------------------------------------------------

def nodes_matching_keywords(graph: dict, keywords: list[str], top_n: int = 5) -> list[dict]:
    """
    Find nodes in graph whose label/norm_label/community_name/source_file
    contains any of the keywords. Rank by degree (number of edges).
    """
    kw_lower = [k.lower() for k in keywords if len(k) > 3]
    if not kw_lower:
        return []

    # Build degree index
    degree: dict[str, int] = {}
    for link in graph["links"]:
        degree[link["source"]] = degree.get(link["source"], 0) + 1
        degree[link["target"]] = degree.get(link["target"], 0) + 1

    scored: list[tuple[int, dict]] = []
    for node in graph["nodes"]:
        searchable = " ".join([
            node.get("label", ""),
            node.get("norm_label", ""),
            node.get("community_name", ""),
            node.get("source_file", ""),
        ]).lower()
        if any(kw in searchable for kw in kw_lower):
            deg = degree.get(node["id"], 0)
            scored.append((deg, node))

    scored.sort(key=lambda x: -x[0])
    return [n for _, n in scored[:top_n]]


# ---------------------------------------------------------------------------
# Query output parser (isolate fragile parsing here)
# ---------------------------------------------------------------------------

def parse_query_node_labels(output: str) -> list[str]:
    """
    Extract node labels from `graphify query` CLI output.
    Lines starting with "NODE <label>" are the primary signal.
    Falls back to lines with [community=...] pattern.
    Returns list of label strings. Empty list on parse failure.
    """
    labels = []
    for line in output.splitlines():
        line = line.strip()
        if line.startswith("NODE "):
            # NODE label [community=X, degree=Y]  OR  NODE label
            label_part = line[5:]
            bracket = label_part.find(" [")
            label = label_part[:bracket].strip() if bracket != -1 else label_part.strip()
            if label:
                labels.append(label)
    return labels


def labels_to_nodes(graph: dict, labels: list[str]) -> list[dict]:
    """Look up nodes by label or norm_label. Return matched nodes."""
    label_index = {}
    for node in graph["nodes"]:
        label_index[node.get("label", "")] = node
        label_index[node.get("norm_label", "")] = node

    degree: dict[str, int] = {}
    for link in graph["links"]:
        degree[link["source"]] = degree.get(link["source"], 0) + 1
        degree[link["target"]] = degree.get(link["target"], 0) + 1

    matched = []
    for label in labels:
        node = label_index.get(label)
        if node:
            matched.append((degree.get(node["id"], 0), node))

    matched.sort(key=lambda x: -x[0])
    return [n for _, n in matched]


# ---------------------------------------------------------------------------
# Graphify subcommands
# ---------------------------------------------------------------------------

def run_graphify_query(prompt_text: str, timeout: int = 60) -> tuple[bool, str]:
    """Run graphify query. Returns (success, output)."""
    env = {**os.environ, **GRAPHIFY_SKIP_ENV}
    r = subprocess.run(
        ["graphify", "query", prompt_text],   # prompt passed as arg, not via shell
        capture_output=True, text=True,
        env=env, timeout=timeout
    )
    return r.returncode == 0, r.stdout + r.stderr


def run_graphify_explain(label: str, timeout: int = 30) -> tuple[bool, str]:
    """Run graphify explain. Returns (success, output)."""
    env = {**os.environ, **GRAPHIFY_SKIP_ENV}
    r = subprocess.run(
        ["graphify", "explain", label],
        capture_output=True, text=True,
        env=env, timeout=timeout
    )
    return r.returncode == 0, r.stdout + r.stderr


# ---------------------------------------------------------------------------
# Lock
# ---------------------------------------------------------------------------

LOCK_PATH = Path(".graphify/graph.lock")


class GraphLock:
    """
    Advisory lock to prevent simultaneous triggered rebuilds from our scripts.

    NOTE: This lock does NOT coordinate with graphify's post-commit or
    post-checkout hooks. Those hooks use graphify's internal
    graphify.watch._rebuild_code lock. Our lock prevents our own scripts
    (user-prompt hook and manual feature-context script) from issuing two
    rebuild commands simultaneously. If a hook rebuild is already in progress,
    our rebuild may proceed concurrently — this is a known limitation of Stage 1.
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self._fd = None

    def acquire(self) -> bool:
        LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
        deadline = time.monotonic() + self.timeout
        self._fd = open(LOCK_PATH, "w")
        while True:
            try:
                fcntl.flock(self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                self._fd.write(str(os.getpid()))
                self._fd.flush()
                return True
            except BlockingIOError:
                if time.monotonic() > deadline:
                    self._fd.close()
                    self._fd = None
                    return False
                time.sleep(0.5)

    def release(self):
        if self._fd:
            try:
                fcntl.flock(self._fd, fcntl.LOCK_UN)
                self._fd.close()
            except Exception:
                pass
            self._fd = None

    def __enter__(self):
        return self.acquire()

    def __exit__(self, *_):
        self.release()


# ---------------------------------------------------------------------------
# Core context generation
# ---------------------------------------------------------------------------

def generate_context_report(
    branch: str,
    task_text: str,
    key_node: Optional[str] = None,
    force: bool = False,
    graph_path: Path = Path("graphify-out/graph.json"),
    context_dir: Path = Path(".graphify/context"),
) -> tuple[bool, str, str]:
    """
    Generate (or reuse) a branch context report.
    Returns (generated: bool, report_path: str, message: str).
    """
    context_dir.mkdir(parents=True, exist_ok=True)
    slug = branch_slug(branch)
    report_path = context_dir / f"{slug}.md"

    graph = load_graph(graph_path)

    # Check if we need to rebuild graph
    if graph is None:
        lock = GraphLock(timeout=30)
        acquired = lock.acquire()
        if not acquired:
            # Wait briefly and recheck
            time.sleep(3)
            graph = load_graph(graph_path)
            if graph is None:
                return False, str(report_path), "Graph unavailable and could not acquire lock to rebuild"
        else:
            try:
                ok = build_graph_code_only()
                if not ok:
                    return False, str(report_path), "Graph build failed. Check ~/.cache/graphify-rebuild.log"
                graph = load_graph(graph_path)
            finally:
                lock.release()

    if graph is None:
        return False, str(report_path), "Graph still unavailable after rebuild attempt"

    # Check graph validity (not just freshness)
    is_valid, validity_reason = graph_is_valid(graph_path, branch)
    if not is_valid:
        # Try to update
        lock = GraphLock(timeout=30)
        acquired = lock.acquire()
        if acquired:
            try:
                env = {**os.environ, **GRAPHIFY_SKIP_ENV}
                subprocess.run(
                    ["graphify", "update", ".", "--code-only"],
                    env=env, timeout=180, capture_output=True
                )
                graph = load_graph(graph_path)
            finally:
                lock.release()

    regen, reason = should_regenerate(report_path, branch, task_text, graph, force)
    if not regen:
        return False, str(report_path), f"Reusing existing report ({reason})"

    # Generate
    base_commit = branch_base_commit(branch)
    graph_commit = graph_built_at_commit(graph) if graph else ""
    version = pinned_version() or installed_graphify_version()
    t_hash = task_hash(task_text)

    # Step 1: Run graphify query
    q_ok, q_output = run_graphify_query(task_text)

    # Step 2: Infer key nodes
    inferred_labels = parse_query_node_labels(q_output) if q_ok else []
    inferred_nodes = labels_to_nodes(graph, inferred_labels) if graph and inferred_labels else []

    # Fallback: keyword match against graph
    if not inferred_nodes and graph:
        keywords = [w for w in re.split(r'\W+', task_text) if len(w) > 3]
        inferred_nodes = nodes_matching_keywords(graph, keywords, top_n=3)

    # Combine with explicit key node
    explain_labels: list[str] = []
    if key_node:
        explain_labels.append(key_node)
    for n in inferred_nodes[:3]:
        lbl = n.get("label", "")
        if lbl and lbl not in explain_labels:
            explain_labels.append(lbl)

    # Step 3: Run graphify explain for top nodes
    explain_sections: list[str] = []
    for label in explain_labels[:4]:
        e_ok, e_output = run_graphify_explain(label)
        if e_ok and e_output.strip():
            explain_sections.append(f"### Key concept: `{label}`\n\n```\n{e_output.strip()}\n```")

    # Build report
    front_matter = f"""---
branch: {branch}
base_commit: {base_commit}
graph_commit: {graph_commit}
original_task_hash: {t_hash}
generated_at: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
graphify_version: {version}
---"""

    sections = [
        front_matter,
        "## Feature Context Report",
        f"**Branch:** `{branch}`",
        f"**Task:** {task_text}",
        "",
        f"### Graph Query: `{task_text[:80]}`",
        "",
        (q_output.strip() if q_ok and q_output.strip() else "_No query output returned._"),
        "",
    ] + explain_sections

    if not explain_sections:
        sections.append("_No key concepts identified. Use `graphify explain <concept>` manually._")

    report_content = "\n\n".join(s for s in sections if s is not None)
    report_path.write_text(report_content)

    return True, str(report_path), f"Generated context report for branch '{branch}'"
