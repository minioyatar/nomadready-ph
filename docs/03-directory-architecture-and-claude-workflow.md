# 03 — Directory Architecture and Claude Workflow

> This document describes the monorepo structure and how Claude Code should be used on this project.

## Directory Structure

See `CLAUDE.md` for the full required directory architecture.

## Claude Code Workflow

```
Spec → Task → Branch → Claude Implementation → Human Review → Test → Merge → Deploy
```

## Feature Branch Build Order

1. feature/project-setup
2. feature/backend-models-seed
3. feature/scoring-engine
4. feature/dashboard-overview
5. feature/assets-table
6. feature/map-view
7. feature/ai-readiness-advisor
8. feature/cicd-deployment
9. feature/demo-polish
