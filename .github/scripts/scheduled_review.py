import os
import json
import subprocess
import urllib.request
import urllib.error
import re

repo = os.environ["REPO"]
api_key = os.environ["ANTHROPIC_API_KEY"]
gh_token = os.environ["GH_TOKEN"]

# 1. Get all open PRs with head commit SHA
result = subprocess.run(
    ["gh", "pr", "list", "--repo", repo, "--state", "open",
     "--json", "number,title,author,headRefName,headRefOid"],
    capture_output=True, text=True
)
prs = json.loads(result.stdout)

if not prs:
    print("No open PRs to review. All clear.")
    raise SystemExit(0)

print(f"Found {len(prs)} open PR(s).\n")

for pr in prs:
    pr_num = pr["number"]
    pr_title = pr["title"]
    pr_author = pr["author"]["login"]
    pr_branch = pr["headRefName"]
    commit_sha = pr["headRefOid"]

    print(f"=== PR #{pr_num}: {pr_title} ({pr_author}) ===")

    # 2. Get PR diff
    diff_result = subprocess.run(
        ["gh", "pr", "diff", str(pr_num), "--repo", repo],
        capture_output=True, text=True
    )
    diff = diff_result.stdout[:9000]

    # 3. Build Claude prompt
    prompt = (
        f'Review PR #{pr_num} "{pr_title}" by {pr_author} (branch: {pr_branch}) '
        "for the NomadReady PH hackathon project.\n\n"
        "PROJECT RULES (non-negotiable):\n"
        "- LGU dashboard: Digital Nomad Readiness Score for Carles, Iloilo, Philippines\n"
        "- Stack: Django + DRF backend | React + Vite + Tailwind CSS frontend | PostgreSQL\n"
        "- Numeric scoring is deterministic Python ONLY — OpenAI must never calculate the score\n"
        "- Only lgu_verified listings count toward the score. Draft listings must not increase it.\n"
        "- Category scores capped at 100. Overall score rounded to nearest whole number.\n"
        "- Approved screens: /dashboard /assets /map /ai-advisor\n"
        "- Out-of-scope (flag immediately): auth, booking, payments, reviews, multi-LGU\n"
        "- Frontend must use Tailwind utility classes — not inline styles or injected <style> tags\n"
        "- AI Advisor screen: recommendations must be sliced to a maximum of 3\n"
        "- Backend: scoring logic stays in scoring/services.py only\n\n"
        f"PR DIFF:\n{diff}\n\n"
        "Return ONLY a valid JSON object. No markdown fences, no explanation.\n\n"
        '{\n'
        '  "summary": "2-3 sentence overall assessment of this PR for the team lead",\n'
        '  "verdict": "READY TO MERGE | NEEDS CHANGES | BLOCKED",\n'
        '  "event": "COMMENT | REQUEST_CHANGES",\n'
        '  "inline_comments": [\n'
        '    {\n'
        '      "path": "exact/relative/path/from/repo/root/file.ext",\n'
        '      "line": 42,\n'
        '      "body": "Specific actionable comment. Prefix: must-fix | warning | optional"\n'
        '    }\n'
        '  ]\n'
        '}\n\n'
        "Rules:\n"
        "- event is REQUEST_CHANGES when verdict is NEEDS CHANGES or BLOCKED, else COMMENT\n"
        "- inline_comments only on lines present in the diff (right/new side)\n"
        "- path must match exactly as shown after b/ in the diff header\n"
        "- Maximum 8 inline comments — prioritize must-fix\n"
        "- Use [] for inline_comments when no specific line has an issue"
    )

    # 4. Call Claude API
    payload = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            raw = data["content"][0]["text"].strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  Claude API HTTP {e.code} for PR #{pr_num}: {body[:500]}")
        continue
    except Exception as e:
        print(f"  Claude API error for PR #{pr_num}: {e}")
        continue

    # 5. Parse Claude response
    try:
        if "```" in raw:
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL)
            raw = match.group(1) if match else raw
        review = json.loads(raw)
    except json.JSONDecodeError:
        review = {
            "summary": raw,
            "verdict": "SEE COMMENTS",
            "event": "COMMENT",
            "inline_comments": [],
        }

    # 6. Build review body
    icons = {"READY TO MERGE": "✅", "NEEDS CHANGES": "⚠️", "BLOCKED": "🚫"}
    icon = icons.get(review.get("verdict", ""), "🤖")
    verdict = review.get("verdict", "SEE COMMENTS")
    body = (
        "## 🤖 Scheduled Daily Review — 3am PHT\n\n"
        + review.get("summary", "") + "\n\n"
        + f"**Verdict: {icon} {verdict}**\n\n"
        + "---\n"
        + "*Automated review by Claude · Human approval required before merge*"
    )

    inline = [
        {
            "path": c["path"],
            "line": int(c["line"]),
            "side": "RIGHT",
            "body": c["body"],
        }
        for c in review.get("inline_comments", [])
        if c.get("path") and c.get("line") and c.get("body")
    ]

    # 7. Post GitHub PR Review
    def post_review(comments):
        api_payload = {
            "commit_id": commit_sha,
            "body": body,
            "event": review.get("event", "COMMENT"),
            "comments": comments,
        }
        api_req = urllib.request.Request(
            f"https://api.github.com/repos/{repo}/pulls/{pr_num}/reviews",
            data=json.dumps(api_payload).encode(),
            headers={
                "Authorization": f"token {gh_token}",
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json",
            }
        )
        with urllib.request.urlopen(api_req, timeout=30) as r:
            return json.loads(r.read())

    try:
        result_data = post_review(inline)
        print(f"  Review #{result_data['id']} posted — {len(inline)} inline comment(s)")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  Inline error ({e.code}): {err[:200]}")
        print("  Retrying without inline comments...")
        try:
            result_data = post_review([])
            print(f"  Plain review #{result_data['id']} posted")
        except urllib.error.HTTPError as e2:
            print(f"  Review API failed: {e2.code} — {e2.read().decode()[:200]}")

    print()

print("Done. All open PRs reviewed.")
