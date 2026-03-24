# EduConnect Portal Conventions

## Commit Messages

When creating commits in this repository, use:

`type: :emoji: short description`

Preferred types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

## Commit Strategy

Do not default to a single large commit when the work includes multiple logical steps.

Prefer a sequence of small commits that explains the implementation flow.

Examples of good commit boundaries:

- planning or documentation
- route or navigation changes
- API integration updates
- state management changes
- UI implementation
- tests
- cleanup or follow-up refactor

If a request includes many changed files, group them by functionality or concern and commit them separately when the boundaries are clear.

## Frontend Feature Planning

For a new frontend feature, start in plan mode first when the user indicates feature work.

Create or update a planning document from the planning results when the work changes navigation, auth flow, data fetching behavior, UI architecture, or reusable patterns.

If the feature is substantial, add a PRD-style document under `docs/frontend/` or another clearly scoped docs location already used by the repository.

The planning document should capture:

- user goal
- planning outcome and implementation approach
- screens or flows affected
- API dependencies
- state management impact
- permissions or route-guard impact
- UI risks and edge cases

The frontend repository must remain understandable on its own, even if the agent had extra context from the workspace root.

## Frontend Documentation

Create or update a file in `docs/` when the change affects:

- routing
- auth guards
- API integration patterns
- shared UI patterns
- state management
- repository conventions

Prefer extending an existing doc when the topic already exists.

If important implementation context only exists in workspace-level discussion, document it here.
