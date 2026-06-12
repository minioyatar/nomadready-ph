# 07 — Spec-Driven Development Methodology

> This document describes the development methodology used for NomadReady PH.

## Core Principle

Build only what is specified. Approve before building.

## Workflow

```
Spec → Task → Branch → Claude Implementation → Human Review → Test → Merge → Deploy
```

## Claude Code Protocol

Before coding any feature, Claude responds with:
1. What I understand
2. Files I expect to modify
3. Implementation steps
4. Acceptance criteria
5. Risks or unclear items

After completing a feature, Claude responds with:
1. Feature branch name
2. Summary of what was implemented
3. Files changed
4. Tests or checks run
5. Acceptance criteria status
6. Anything not completed
7. Risks or follow-up needed
8. Confirmation that no out-of-scope features were added

## Rules

- Claude does not decide scope.
- Claude does not change architecture without approval.
- Claude does not add "nice to have" features.
- One feature = one branch.
- Do not push unfinished work to main.
