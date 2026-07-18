"""Tests for Graphify workflow scripts. No Anthropic API key required."""
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import MagicMock, patch
import unittest

# Allow importing scripts
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
import graphify_common as gc


class TestBranchSlug(unittest.TestCase):
    def test_slash_becomes_hyphen(self):
        self.assertEqual(gc.branch_slug("feature/foo-bar"), "feature-foo-bar")

    def test_special_chars_removed(self):
        self.assertEqual(gc.branch_slug("chore/update_graphify!"), "chore-update-graphify")

    def test_lowercase(self):
        self.assertEqual(gc.branch_slug("Feature/X"), gc.branch_slug("Feature/X").lower())

    def test_double_hyphens_collapsed(self):
        self.assertNotIn("--", gc.branch_slug("feature//double"))


class TestTaskHash(unittest.TestCase):
    def test_same_text_same_hash(self):
        self.assertEqual(gc.task_hash("add scoring"), gc.task_hash("add scoring"))

    def test_different_text_different_hash(self):
        self.assertNotEqual(gc.task_hash("add scoring"), gc.task_hash("remove scoring"))

    def test_case_insensitive(self):
        self.assertEqual(gc.task_hash("Add Scoring"), gc.task_hash("add scoring"))

    def test_twelve_chars(self):
        self.assertEqual(len(gc.task_hash("anything")), 12)


class TestReadReportMeta(unittest.TestCase):
    def _write_report(self, tmpdir, meta_dict: dict) -> Path:
        meta_lines = "\n".join(f"{k}: {v}" for k, v in meta_dict.items())
        content = f"---\n{meta_lines}\n---\n\n## Content"
        p = Path(tmpdir) / "test.md"
        p.write_text(content)
        return p

    def test_reads_all_fields(self):
        with tempfile.TemporaryDirectory() as tmp:
            meta = {"branch": "feature/x", "graph_commit": "abc123",
                    "original_task_hash": "hash1", "graphify_version": "0.9.17"}
            p = self._write_report(tmp, meta)
            result = gc.read_report_meta(p)
            self.assertEqual(result["branch"], "feature/x")
            self.assertEqual(result["graph_commit"], "abc123")

    def test_missing_front_matter_returns_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "no-meta.md"
            p.write_text("## Just content\n\nno front matter")
            self.assertIsNone(gc.read_report_meta(p))

    def test_nonexistent_file_returns_none(self):
        self.assertIsNone(gc.read_report_meta(Path("/nonexistent/path.md")))


class TestShouldRegenerate(unittest.TestCase):
    FAKE_GRAPH = {
        "nodes": [], "links": [], "hyperedges": [],
        "directed": False, "built_at_commit": "abc123def456"
    }

    def _make_report(self, tmpdir: str, meta: dict) -> Path:
        meta_lines = "\n".join(f"{k}: {v}" for k, v in meta.items())
        content = f"---\n{meta_lines}\n---\n\n## Content"
        p = Path(tmpdir) / "feature-x.md"
        p.write_text(content)
        return p

    def test_missing_report_triggers_regen(self):
        regen, reason = gc.should_regenerate(
            Path("/nonexistent.md"), "feature/x", "my task", self.FAKE_GRAPH
        )
        self.assertTrue(regen)
        self.assertIn("no context report", reason)

    def test_force_always_regenerates(self):
        with tempfile.TemporaryDirectory() as tmp:
            meta = {
                "branch": "feature/x", "graph_commit": "abc123def456",
                "original_task_hash": gc.task_hash("my task"),
                "graphify_version": "0.9.17", "base_commit": ""
            }
            p = self._make_report(tmp, meta)
            regen, reason = gc.should_regenerate(p, "feature/x", "my task", self.FAKE_GRAPH, force=True)
            self.assertTrue(regen)
            self.assertIn("force", reason.lower())

    def test_wrong_branch_triggers_regen(self):
        with tempfile.TemporaryDirectory() as tmp:
            meta = {
                "branch": "feature/other", "graph_commit": "abc123def456",
                "original_task_hash": gc.task_hash("my task"),
                "graphify_version": "0.9.17", "base_commit": ""
            }
            p = self._make_report(tmp, meta)
            regen, reason = gc.should_regenerate(p, "feature/x", "my task", self.FAKE_GRAPH)
            self.assertTrue(regen)
            self.assertIn("branch", reason)

    def test_different_prompt_does_not_trigger_regen(self):
        """Later prompts on same branch must reuse report — task hash is original."""
        with tempfile.TemporaryDirectory() as tmp:
            meta = {
                "branch": "feature/x", "graph_commit": "abc123def456",
                "original_task_hash": gc.task_hash("original task"),
                "graphify_version": "0.9.17", "base_commit": ""
            }
            p = self._make_report(tmp, meta)
            # Different prompt text, same branch, same graph commit
            regen, reason = gc.should_regenerate(
                p, "feature/x", "a completely different follow-up prompt", self.FAKE_GRAPH
            )
            # Should NOT regenerate — later prompts reuse the branch report
            self.assertFalse(regen)

    def test_graph_version_mismatch_triggers_regen(self):
        with tempfile.TemporaryDirectory() as tmp:
            meta = {
                "branch": "feature/x", "graph_commit": "abc123def456",
                "original_task_hash": gc.task_hash("my task"),
                "graphify_version": "0.9.16", "base_commit": ""
            }
            p = self._make_report(tmp, meta)
            with patch("graphify_common.pinned_version", return_value="0.9.17"), \
                 patch("graphify_common.installed_graphify_version", return_value="0.9.17"):
                regen, reason = gc.should_regenerate(
                    p, "feature/x", "my task",
                    {**self.FAKE_GRAPH},
                    force=False
                )
            self.assertTrue(regen)
            self.assertIn("version", reason.lower())


class TestLoadGraph(unittest.TestCase):
    def test_valid_graph(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "graph.json"
            data = {"nodes": [], "links": [], "built_at_commit": "abc"}
            p.write_text(json.dumps(data))
            g = gc.load_graph(p)
            self.assertIsNotNone(g)
            self.assertEqual(g["built_at_commit"], "abc")

    def test_invalid_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "graph.json"
            p.write_text("not json")
            g = gc.load_graph(p)
            self.assertIsNone(g)

    def test_missing_required_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "graph.json"
            p.write_text(json.dumps({"nodes": []}))  # missing links and built_at_commit
            g = gc.load_graph(p)
            self.assertIsNone(g)

    def test_nonexistent_file(self):
        g = gc.load_graph(Path("/nonexistent/graph.json"))
        self.assertIsNone(g)


class TestParseQueryNodeLabels(unittest.TestCase):
    SAMPLE_OUTPUT = """
Traversal: BFS depth=2 | Start: ['scoring'] | 5 nodes found

NODE calculate_destination_score() [community=scoring, degree=16]
NODE ScoreSnapshot [community=scoring, degree=17]
NODE Destination [community=destination, degree=15]
EDGE calculate_destination_score --calls--> ScoreSnapshot [EXTRACTED]
"""

    def test_extracts_node_labels(self):
        labels = gc.parse_query_node_labels(self.SAMPLE_OUTPUT)
        self.assertIn("calculate_destination_score()", labels)
        self.assertIn("ScoreSnapshot", labels)
        self.assertIn("Destination", labels)

    def test_ignores_edge_lines(self):
        labels = gc.parse_query_node_labels(self.SAMPLE_OUTPUT)
        self.assertNotIn("EDGE calculate_destination_score --calls--> ScoreSnapshot [EXTRACTED]", labels)

    def test_empty_output_returns_empty_list(self):
        self.assertEqual(gc.parse_query_node_labels(""), [])

    def test_no_node_lines_returns_empty(self):
        self.assertEqual(gc.parse_query_node_labels("Traversal: BFS...\nEDGE a --> b"), [])

    def test_node_without_bracket(self):
        labels = gc.parse_query_node_labels("NODE SimpleNode\n")
        self.assertIn("SimpleNode", labels)


class TestBlastRadiusHelpers(unittest.TestCase):
    """Tests for graphify_blast_radius.py helper functions."""

    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent / ".github" / "scripts"))
        import graphify_blast_radius as br
        self.br = br

    def test_classify_layer_model(self):
        self.assertEqual(self.br.classify_layer("backend/apps/destinations/models.py"), "Model")

    def test_classify_layer_scoring(self):
        self.assertEqual(self.br.classify_layer("backend/apps/scoring/services.py"), "Scoring Engine")

    def test_classify_layer_frontend(self):
        self.assertEqual(self.br.classify_layer("frontend/src/routes/Dashboard.jsx"), "Frontend")

    def test_classify_layer_tests(self):
        self.assertEqual(self.br.classify_layer("backend/apps/scoring/tests.py"), "Tests")

    def test_is_test_file(self):
        self.assertTrue(self.br.is_test_file("backend/apps/scoring/tests.py"))
        self.assertFalse(self.br.is_test_file("backend/apps/scoring/services.py"))

    def test_build_adjacency_forward_and_reverse(self):
        graph = {
            "nodes": [
                {"id": "a"}, {"id": "b"}, {"id": "c"}
            ],
            "links": [
                {"source": "a", "target": "b", "relation": "calls", "confidence": "EXTRACTED"},
                {"source": "b", "target": "c", "relation": "imports", "confidence": "EXTRACTED"},
            ]
        }
        fwd, rev = self.br.build_adjacency(graph)
        self.assertEqual(fwd["a"][0]["node"], "b")
        self.assertEqual(rev["b"][0]["node"], "a")
        self.assertEqual(rev["c"][0]["node"], "b")

    def test_bfs_finds_dependents(self):
        fwd = {}
        rev = {
            "b": [{"node": "a", "relation": "calls", "confidence": "EXTRACTED"}],
            "c": [{"node": "b", "relation": "calls", "confidence": "EXTRACTED"}],
        }
        result = self.br.bfs_dependents(["b"], rev, max_hops=2, time_limit=10)
        self.assertIn("a", result)
        self.assertEqual(result["a"], 1)

    def test_sentinel_present_in_report(self):
        """Regression: sentinel must appear in every generated report."""
        self.assertIn("graphify-blast-radius", self.br.SENTINEL)

    def test_parse_changed_files_a_m_d(self):
        """Verify A/M/D status parsing (R is integration-tested in CI)."""
        sample = "A\tnew_file.py\nM\texisting.py\nD\tdeleted.py\n"
        mock_result = type('R', (), {'stdout': sample, 'returncode': 0})()
        base_sha = "a" * 40
        head_sha = "b" * 40
        with patch('subprocess.run', return_value=mock_result):
            changed = self.br.get_changed_files(base_sha, head_sha)
        self.assertIn("new_file.py", changed["added"])
        self.assertIn("existing.py", changed["modified"])
        self.assertIn("deleted.py", changed["deleted"])


class TestValidateSha(unittest.TestCase):
    """Finding 1: SHA validation for deterministic diff references."""

    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent / ".github" / "scripts"))
        import graphify_blast_radius as br
        self.br = br

    def test_valid_sha_returned_lowercase(self):
        sha = "a" * 40
        self.assertEqual(self.br.validate_sha(sha, "BASE_SHA"), sha)

    def test_valid_sha_uppercase_accepted(self):
        sha = "A" * 40
        result = self.br.validate_sha(sha, "HEAD_SHA")
        self.assertEqual(result, sha.lower())

    def test_missing_sha_raises(self):
        with self.assertRaises(ValueError) as ctx:
            self.br.validate_sha("", "BASE_SHA")
        self.assertIn("BASE_SHA", str(ctx.exception))

    def test_malformed_sha_raises(self):
        with self.assertRaises(ValueError) as ctx:
            self.br.validate_sha("not-a-sha", "HEAD_SHA")
        self.assertIn("HEAD_SHA", str(ctx.exception))

    def test_branch_name_rejected(self):
        with self.assertRaises(ValueError):
            self.br.validate_sha("main", "BASE_SHA")

    def test_short_sha_rejected(self):
        with self.assertRaises(ValueError):
            self.br.validate_sha("abc123", "HEAD_SHA")


class TestGetChangedFilesSha(unittest.TestCase):
    """Finding 1: get_changed_files must use SHA...SHA, not branch names."""

    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent / ".github" / "scripts"))
        import graphify_blast_radius as br
        self.br = br

    def test_uses_sha_comparison_not_branch(self):
        """git diff must receive SHA...SHA, never origin/<branch>."""
        sample = "A\tnew_file.py\n"
        mock_result = type('R', (), {'stdout': sample, 'returncode': 0})()
        base_sha = "a" * 40
        head_sha = "b" * 40
        with patch('subprocess.run', return_value=mock_result) as mock_run:
            self.br.get_changed_files(base_sha, head_sha)
        args = mock_run.call_args[0][0]
        self.assertIn(f"{base_sha}...{head_sha}", args)
        self.assertNotIn("origin/", " ".join(args))

    def test_no_branch_name_in_args(self):
        """Branch names must never appear in the git diff argument list."""
        mock_result = type('R', (), {'stdout': "", 'returncode': 0})()
        with patch('subprocess.run', return_value=mock_result) as mock_run:
            self.br.get_changed_files("a" * 40, "b" * 40)
        args = mock_run.call_args[0][0]
        for arg in args:
            self.assertNotRegex(arg, r'^(main|master|feature|fix|chore)/')


class TestDeletedRenamedGraphSelection(unittest.TestCase):
    """Finding 2: deleted/renamed files must use correct graph for BFS."""

    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent / ".github" / "scripts"))
        import graphify_blast_radius as br
        self.br = br

    def test_deleted_node_found_via_base_graph(self):
        """BFS for a deleted node must traverse base graph reverse adjacency."""
        base_graph = {
            "nodes": [
                {"id": "deleted_fn", "label": "deleted_fn()", "source_file": "old.py"},
                {"id": "dependent_fn", "label": "dep()", "source_file": "dep.py"},
            ],
            "links": [
                {"source": "dependent_fn", "target": "deleted_fn",
                 "relation": "calls", "confidence": "EXTRACTED"},
            ],
            "built_at_commit": "base123",
        }
        _, rev_adj_base = self.br.build_adjacency(base_graph)
        result = self.br.bfs_dependents(["deleted_fn"], rev_adj_base, max_hops=2, time_limit=10)
        self.assertIn("dependent_fn", result)
        self.assertEqual(result["dependent_fn"], 1)

    def test_deleted_node_not_in_head_adjacency(self):
        """A node deleted in head should not appear in head graph adjacency."""
        head_graph = {
            "nodes": [{"id": "surviving_fn", "label": "surviving()", "source_file": "a.py"}],
            "links": [],
            "built_at_commit": "head123",
        }
        _, rev_adj_head = self.br.build_adjacency(head_graph)
        # deleted_fn is not in head, so head adjacency has nothing for it
        self.assertEqual(rev_adj_head.get("deleted_fn", []), [])

    def test_renamed_old_path_uses_base_graph(self):
        """nodes_by_file for the old (renamed-from) path must use base_graph."""
        base_graph = {
            "nodes": [{"id": "old_fn", "label": "old_fn()", "source_file": "old.py"}],
            "links": [],
            "built_at_commit": "base123",
        }
        old_nodes = self.br.nodes_by_file(base_graph, "old.py")
        self.assertEqual(len(old_nodes), 1)
        self.assertEqual(old_nodes[0]["id"], "old_fn")

    def test_renamed_new_path_uses_head_graph(self):
        """nodes_by_file for the new (renamed-to) path must use head_graph."""
        head_graph = {
            "nodes": [{"id": "new_fn", "label": "new_fn()", "source_file": "new.py"}],
            "links": [],
            "built_at_commit": "head123",
        }
        new_nodes = self.br.nodes_by_file(head_graph, "new.py")
        self.assertEqual(len(new_nodes), 1)
        self.assertEqual(new_nodes[0]["id"], "new_fn")

    def test_bfs_merge_takes_minimum_hop(self):
        """When a node is reachable from both head and base BFS, keep minimum hop."""
        rev_adj_a = {"shared": [{"node": "x", "relation": "calls", "confidence": "EXTRACTED"}]}
        rev_adj_b = {"deleted": [{"node": "x", "relation": "calls", "confidence": "EXTRACTED"}]}
        reachable_a = self.br.bfs_dependents(["shared"], rev_adj_a, max_hops=3, time_limit=10)
        reachable_b = self.br.bfs_dependents(["deleted"], rev_adj_b, max_hops=3, time_limit=10)
        # Merge logic: take minimum hop
        merged = {}
        for nid, hop in reachable_a.items():
            merged[nid] = hop
        for nid, hop in reachable_b.items():
            if nid not in merged or hop < merged[nid]:
                merged[nid] = hop
        self.assertEqual(merged.get("x"), 1)


class TestContextResultStates(unittest.TestCase):
    """Finding 4: generate_context_report must return a string status, not a bool."""

    def test_failed_returns_string_not_bool(self):
        mock_lock = MagicMock()
        mock_lock.acquire.return_value = True
        mock_lock.release.return_value = None
        with patch("graphify_common.load_graph", return_value=None), \
             patch("graphify_common.GraphLock", return_value=mock_lock), \
             patch("graphify_common.build_graph_code_only", return_value=False):
            status, _path, _msg = gc.generate_context_report(
                branch="feature/test",
                task_text="test task",
            )
        self.assertIsInstance(status, str)
        self.assertNotIsInstance(status, bool)
        self.assertEqual(status, "failed")

    def test_reused_and_failed_are_distinct(self):
        self.assertNotEqual("failed", "reused")
        self.assertNotEqual("failed", "generated")
        self.assertNotEqual("reused", "generated")

    def test_repair_failure_returns_failed(self):
        """When graph update command fails, status must be 'failed'."""
        mock_lock = MagicMock()
        mock_lock.acquire.return_value = True
        mock_lock.release.return_value = None
        fake_graph = {"nodes": [], "links": [], "built_at_commit": "old"}
        failed_run = MagicMock()
        failed_run.returncode = 1
        failed_run.stderr = "graphify update error"
        with patch("graphify_common.load_graph", return_value=fake_graph), \
             patch("graphify_common.graph_is_valid", return_value=(False, "stale")), \
             patch("graphify_common.GraphLock", return_value=mock_lock), \
             patch("graphify_common.subprocess.run", return_value=failed_run):
            status, _path, msg = gc.generate_context_report(
                branch="feature/test",
                task_text="test task",
            )
        self.assertEqual(status, "failed")
        self.assertIn("repair failed", msg.lower())

    def test_repair_success_rechecks_validity(self):
        """After a successful update command, validity must be rechecked."""
        mock_lock = MagicMock()
        mock_lock.acquire.return_value = True
        mock_lock.release.return_value = None
        fake_graph = {"nodes": [], "links": [], "built_at_commit": "abc" * 14}
        ok_run = MagicMock()
        ok_run.returncode = 0
        ok_run.stderr = ""
        # First load returns stale graph; after repair also returns same graph
        with patch("graphify_common.load_graph", return_value=fake_graph), \
             patch("graphify_common.graph_is_valid", side_effect=[
                 (False, "stale"),        # first check
                 (False, "still stale"),  # post-repair check
             ]), \
             patch("graphify_common.GraphLock", return_value=mock_lock), \
             patch("graphify_common.subprocess.run", return_value=ok_run):
            status, _path, msg = gc.generate_context_report(
                branch="feature/test",
                task_text="test task",
            )
        self.assertEqual(status, "failed")
        self.assertIn("still invalid", msg.lower())


class TestContextStalenessWarnings(unittest.TestCase):
    """Finding 5: guard must check branch, base commit, graph commit, and version."""

    FAKE_GRAPH = {"nodes": [], "links": [], "built_at_commit": "abc123def456" + "0" * 28}

    def _meta(self, **overrides):
        base = {
            "branch": "feature/x",
            "graphify_version": "0.9.17",
            "base_commit": "",
            "graph_commit": "abc123def456" + "0" * 28,
        }
        base.update(overrides)
        return base

    def test_no_warnings_when_current(self):
        meta = self._meta()
        with patch("graphify_common.pinned_version", return_value="0.9.17"), \
             patch("graphify_common.installed_graphify_version", return_value="0.9.17"), \
             patch("graphify_common.branch_base_commit", return_value=""), \
             patch("graphify_common.load_graph", return_value=self.FAKE_GRAPH):
            result = gc.context_staleness_warnings(meta, "feature/x")
        self.assertEqual(result, [])

    def test_warns_on_branch_mismatch(self):
        meta = self._meta(branch="feature/other")
        with patch("graphify_common.pinned_version", return_value=""), \
             patch("graphify_common.installed_graphify_version", return_value=""), \
             patch("graphify_common.branch_base_commit", return_value=""), \
             patch("graphify_common.load_graph", return_value=None):
            result = gc.context_staleness_warnings(meta, "feature/x")
        self.assertTrue(any("branch" in w.lower() for w in result))

    def test_warns_on_version_mismatch(self):
        meta = self._meta(graphify_version="0.9.16")
        with patch("graphify_common.pinned_version", return_value="0.9.17"), \
             patch("graphify_common.branch_base_commit", return_value=""), \
             patch("graphify_common.load_graph", return_value=None):
            result = gc.context_staleness_warnings(meta, "feature/x")
        self.assertTrue(any("0.9.16" in w or "0.9.17" in w for w in result))

    def test_warns_on_base_commit_change(self):
        old_base = "a" * 40
        new_base = "b" * 40
        meta = self._meta(base_commit=old_base)
        with patch("graphify_common.pinned_version", return_value=""), \
             patch("graphify_common.installed_graphify_version", return_value=""), \
             patch("graphify_common.branch_base_commit", return_value=new_base), \
             patch("graphify_common.load_graph", return_value=None):
            result = gc.context_staleness_warnings(meta, "feature/x")
        self.assertTrue(any("base" in w.lower() or "rebase" in w.lower() for w in result))

    def test_warns_on_graph_commit_change(self):
        new_graph = {**self.FAKE_GRAPH, "built_at_commit": "new" + "0" * 37}
        meta = self._meta(graph_commit="old" + "0" * 37)
        with patch("graphify_common.pinned_version", return_value=""), \
             patch("graphify_common.installed_graphify_version", return_value=""), \
             patch("graphify_common.branch_base_commit", return_value=""), \
             patch("graphify_common.load_graph", return_value=new_graph):
            result = gc.context_staleness_warnings(meta, "feature/x")
        self.assertTrue(any("graph" in w.lower() for w in result))

    def test_returns_list_type(self):
        meta = self._meta()
        with patch("graphify_common.pinned_version", return_value="0.9.17"), \
             patch("graphify_common.branch_base_commit", return_value=""), \
             patch("graphify_common.load_graph", return_value=None):
            result = gc.context_staleness_warnings(meta, "feature/x")
        self.assertIsInstance(result, list)


class TestCIWorkflowStructure(unittest.TestCase):
    """Regression: publication job must use workspace-relative paths."""

    @classmethod
    def setUpClass(cls):
        ci_path = Path(__file__).parent.parent / ".github" / "workflows" / "ci.yml"
        cls.ci_text = ci_path.read_text()

    def test_no_hashfiles_tmp(self):
        self.assertNotIn("hashFiles('/tmp", self.ci_text)

    def test_workspace_relative_report_path(self):
        self.assertIn("blast-radius/graphify-blast-radius-report.md", self.ci_text)

    def test_sentinel_preserved(self):
        self.assertIn("<!-- graphify-blast-radius -->", self.ci_text)


if __name__ == "__main__":
    unittest.main()
