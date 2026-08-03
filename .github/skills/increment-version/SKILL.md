---
name: increment-version
description: 'Increment, bump, or synchronize the Scheduled Climate release version. Use when the user requests a major, minor, or patch version bump, release version change, or project version update across the Home Assistant manifest, Python metadata, frontend package metadata, npm lockfile, and generated package metadata.'
argument-hint: 'major | minor | patch'
user-invocable: true
disable-model-invocation: false
---

# Increment Scheduled Climate Version

Increment every project release-version declaration consistently and validate the resulting release artifacts.

## Input

Require exactly one argument: `major`, `minor`, or `patch`. If it is missing or invalid, ask the user to provide one and do not modify files.

Apply semantic-version increments as follows:

- `major`: `X.Y.Z` becomes `X+1.0.0`
- `minor`: `X.Y.Z` becomes `X.Y+1.0`
- `patch`: `X.Y.Z` becomes `X.Y.Z+1`

Do not infer a bump type from release notes or other context.

## Procedure

1. Run the helper in dry-run mode from the repository root:

   ```shell
   python .github/skills/increment-version/scripts/increment_version.py <major|minor|patch> --dry-run
   ```

   Use the selected project Python interpreter if `python` is not the correct command. Stop without editing if existing declarations disagree or the current version is not exactly `MAJOR.MINOR.PATCH`.

2. Run the increment:

   ```shell
   python .github/skills/increment-version/scripts/increment_version.py <major|minor|patch>
   ```

   The helper updates only these source declarations:

   - `custom_components/scheduled_climate/manifest.json`: top-level `version`
   - `pyproject.toml`: `[project].version`
   - `frontend/package.json`: top-level `version`
   - `frontend/package-lock.json`: top-level `version`
   - `frontend/package-lock.json`: `packages[""].version`

3. Regenerate Python package metadata from `pyproject.toml`; never hand-edit generated metadata:

   ```shell
   python -m pip install --no-deps --editable .
   ```

   This must refresh `scheduled_climate.egg-info/PKG-INFO`. Use the active virtual environment's interpreter when available.

4. Validate and rebuild the frontend from the `frontend` directory:

   ```shell
   npm install --package-lock-only --ignore-scripts
   npm run check
   npm test
   npm run build
   ```

   Confirm the committed bundle at `custom_components/scheduled_climate/frontend/scheduled-climate-card.js` matches the build output.

5. Verify all source and generated release versions agree:

   ```shell
   python .github/skills/increment-version/scripts/increment_version.py --check
   ```

6. Run focused project validation available in the environment. At minimum, run Ruff for changed Python files and the existing backend test suite. On Windows, use the repository's documented Linux Docker test command if native Home Assistant imports fail on POSIX-only modules. Report any validation that could not run.

7. Review the diff and report the old version, new version, changed declarations, regenerated artifacts, and validation results.

## Boundaries

- Do not change `ScheduledClimateConfigFlow.VERSION`; it is a config-entry schema version.
- Do not change `STORAGE_VERSION` in `schedule.py` or `timer.py`; they are storage schema versions.
- Do not change npm dependency versions or lockfile dependency package versions.
- Do not modify Home Assistant minimum-version declarations.
- Do not create a commit, tag, GitHub Release, or push unless the user explicitly requests it.
- Remind the user that HACS requires a published GitHub Release tagged `v<new-version>`; a local version bump or Git tag alone does not publish the update.

The deterministic update logic is in [increment_version.py](./scripts/increment_version.py).
