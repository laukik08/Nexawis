"""
NEXAWIS Backend - Standalone Demo Workspace Seeder Script.
Usage:
  .venv\\Scripts\\python.exe scripts\\seed_demo_workspace.py
"""

import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

import asyncio
from app.core.database import get_db_session
from app.services.demo_seeder import DemoWorkspaceSeeder


async def main():
    print("==================================================")
    print("NEXAWIS — Seeding Dedicated Enterprise Demo Workspace")
    print("==================================================")

    async for db in get_db_session():
        try:
            summary = await DemoWorkspaceSeeder.seed(db)
            print("\nSeeding Successful!")
            print(f"  Workspace ID:     {summary['workspace_id']}")
            print(f"  Workspace Name:   {summary['workspace_name']}")
            print(f"  Employees Seeded: {summary['employees_count']}")
            print(f"  Projects Seeded:  {summary['projects_count']}")
            print(f"  Skills Seeded:    {summary['skills_count']}")
            print(f"  Reports Created:  {summary['pre_generated_reports_count']}")
            print("==================================================")
        except Exception as e:
            print(f"\nERROR during seeding: {e}")
            import traceback
            traceback.print_exc()
        break


if __name__ == "__main__":
    asyncio.run(main())
