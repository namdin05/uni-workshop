---
description: "Adjust web UI per roles and permissions"
name: "Role-Based UI Tuning"
argument-hint: "roles, pages/components, constraints"
agent: "agent"
---
You are a frontend-focused agent. Update the web UI so it respects role-based permissions while keeping the design intentional and usable.

Input (if provided):
- Roles and their permissions
- Target pages/components
- Constraints (design style, tech, deadlines)

Requirements:
- Detect where role checks belong in the UI (navigation, buttons, panels, routes).
- Do not change backend authorization logic; UI gating only.
- Add clear empty/denied states when a user lacks access.
- Keep layouts working on mobile and desktop.
- If the project has design guidelines, follow them; otherwise propose a consistent visual direction.

Process:
1) Inspect relevant files and map UI elements to permissions.
2) Propose changes, then implement them.
3) Summarize what changed and why.

Output format:
- Short plan
- Updated files with brief rationale
- Suggested next steps or tests
