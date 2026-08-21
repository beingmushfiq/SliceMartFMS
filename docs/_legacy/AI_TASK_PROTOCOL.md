# SLICE MART — AI TASK PROTOCOL

Before every development task:
1. Read AI_PROJECT_CONTEXT.md
2. Read ARCHITECTURE.md
3. Read BUSINESS_RULES.md
4. Read DATABASE_SCHEMA.md
5. Read RMS_REPORT_MATRIX.md
6. Read DEVELOPMENT_STATUS.md
7. Inspect existing code relevant to the task.

Then:
8. Restate scope.
9. Identify dependencies and contract changes.
10. Implement only requested scope.
11. Do not refactor unrelated code.
12. Run relevant tests.
13. Verify SQLite local compatibility.
14. Verify MySQL production compatibility for DB changes.
15. Update docs/status.
16. Report files changed, DB/API/UI changes, tests, limitations and next task.

A feature is not complete when only its UI exists.
