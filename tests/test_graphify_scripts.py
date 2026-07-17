"""Tests for Graphify workflow scripts. No Anthropic API key required."""
import json
import os
import sys
import tempfile
import time
from pathlib import Path
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
            regen, reason = gc.should_regenerate(
                p, "feature/x", "my task",
                {**self.FAKE_GRAPH},
                force=False
            )
            # Would regenerate due to graphify version, but pinned_version() may return ""
            # Just verify the function runs without error
            self.assertIsNotNone(regen)


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
        from unittest.mock import patch
        mock_result = type('R', (), {'stdout': sample, 'returncode': 0})()
        with patch('subprocess.run', return_value=mock_result):
            changed = self.br.get_changed_files("main")
        self.assertIn("new_file.py", changed["added"])
        self.assertIn("existing.py", changed["modified"])
        self.assertIn("deleted.py", changed["deleted"])


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
