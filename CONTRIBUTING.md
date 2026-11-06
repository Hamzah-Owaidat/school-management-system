# Contributing Guide

## Branch model

| Branch        | Purpose                    | Merges in from                                      |
| ------------- | -------------------------- | --------------------------------------------------- |
| `production`  | Live code                  | `staging` (release PR), `hotfix/*`                  |
| `staging`     | Release candidate          | `development` (release PR)                          |
| `development` | Default integration branch | `feature/*`, `fix/*`, `chore/*`, `docs/*`, `test/*` |

Never push directly to `production`, `staging` or `development`.

## Work branches

Create work branches from `development` (hotfixes from `production`). Name them after the issue:

- `feature/<issue>-short-name` for new functionality
- `fix/<issue>-short-name` for bug fixes
- `chore/<issue>-short-name` for tooling, config, refactoring
- `docs/<issue>-short-name` for documentation
- `test/<issue>-short-name` for tests only
- `hotfix/<issue>-short-name` for urgent production fixes

Example: `feature/23-login-sessions`

## Commit messages

Use Conventional Commits: `type(scope): summary`

Types: feat, fix, chore, docs, test, refactor, perf, ci, build, style, revert

Examples: `feat(auth): add opaque session tokens` and `fix(attendance): keep correction history`

A commit-msg hook (commitlint) rejects commits that don't follow this format.

## Pull requests

- Open the PR into `development` and fill in the template.
- Write `Closes #<issue>` so the issue closes when the PR merges.
- CI must pass before merging.
- Use **Squash and merge** for work branches.
- The branch is deleted automatically after merging.

## Releases

- Open a PR `development` into `staging` titled `Release vX.Y.Z`.
- Merge it with **Create a merge commit**. Never squash a release PR.
- Test on staging.
- Open a PR `staging` into `production` titled `Release vX.Y.Z` and merge with a merge commit.
- Tag `vX.Y.Z` and publish release notes.

## Hotfixes

- Branch `hotfix/<issue>-short-name` from `production`.
- PR into `production`, merge, tag a patch version such as `v1.0.1`.
- Merge `production` back into `staging` and `development` with PRs so the fix is not lost.

## Versioning

Semantic Versioning. Milestones M1 to M6 ship to staging as v0.1.0 to v0.6.0. The pilot launch is v1.0.0.
