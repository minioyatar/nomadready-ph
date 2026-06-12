#!/bin/bash
# reset-dev.sh — resets the local development environment
# Full implementation will be completed in feature/cicd-deployment
# WARNING: This script will tear down containers and volumes. Review before running.

echo "NomadReady PH — reset-dev.sh"
echo "This script is a placeholder. Do not run in production."
echo ""
echo "Planned steps:"
echo "  1. docker compose down -v"
echo "  2. docker compose up -d --build"
echo "  3. docker compose exec backend python manage.py migrate"
echo "  4. docker compose exec backend python manage.py seed_demo_data"
