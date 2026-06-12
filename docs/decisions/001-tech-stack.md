# Decision 001 — Tech Stack

**Status:** Approved

## Decision

Use Django + DRF + PostgreSQL for the backend, React + Vite + Tailwind for the frontend, Docker Compose for local development.

## Rationale

- Django provides rapid development with a mature ORM and admin panel.
- DRF standardizes API responses.
- PostgreSQL supports the JSON fields needed for `details` and `top_gaps`.
- React + Vite gives a fast development experience.
- Tailwind enables rapid UI without a component library dependency.
- Docker Compose ensures consistent local setup for all team members.

## Alternatives Rejected

- FastAPI: Less admin tooling out of the box.
- Next.js: SSR overhead not needed for an internal LGU dashboard.
