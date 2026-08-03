#!/usr/bin/env python3
"""Increment and synchronize Scheduled Climate release versions."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Final

VERSION_PATTERN: Final = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")
PYPROJECT_PATTERN: Final = re.compile(
    r'(?ms)^(\[project\]\s+.*?^version\s*=\s*")([^"]+)(")'
)
PKG_INFO_PATTERN: Final = re.compile(r"(?m)^(Version: )([^\r\n]+)$")


def _project_root(script_path: Path) -> Path:
    """Find the repository root containing the project metadata."""
    for parent in script_path.resolve().parents:
        if (parent / "pyproject.toml").is_file() and (
            parent / "custom_components" / "scheduled_climate" / "manifest.json"
        ).is_file():
            return parent
    raise RuntimeError("Could not locate the Scheduled Climate repository root")


def _load_json(path: Path) -> dict[str, object]:
    """Load a JSON object."""
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object in {path}")
    return value


def _current_versions(
    root: Path, *, include_generated: bool = True
) -> dict[str, str]:
    """Read all release-version declarations."""
    pyproject_text = (root / "pyproject.toml").read_text(encoding="utf-8")
    pyproject_match = PYPROJECT_PATTERN.search(pyproject_text)
    if pyproject_match is None:
        raise ValueError("Could not find [project].version in pyproject.toml")

    manifest = _load_json(
        root / "custom_components" / "scheduled_climate" / "manifest.json"
    )
    package = _load_json(root / "frontend" / "package.json")
    lock = _load_json(root / "frontend" / "package-lock.json")
    lock_packages = lock.get("packages")
    if not isinstance(lock_packages, dict) or not isinstance(
        lock_packages.get(""), dict
    ):
        raise ValueError("Could not find the root package in package-lock.json")

    versions = {
        "pyproject.toml": pyproject_match.group(2),
        "manifest.json": str(manifest.get("version", "")),
        "frontend/package.json": str(package.get("version", "")),
        "frontend/package-lock.json": str(lock.get("version", "")),
        "frontend/package-lock.json root": str(
            lock_packages[""].get("version", "")
        ),
    }

    pkg_info_path = root / "scheduled_climate.egg-info" / "PKG-INFO"
    if include_generated and pkg_info_path.is_file():
        pkg_info_match = PKG_INFO_PATTERN.search(
            pkg_info_path.read_text(encoding="utf-8")
        )
        if pkg_info_match is None:
            raise ValueError("Could not find Version in generated PKG-INFO")
        versions["scheduled_climate.egg-info/PKG-INFO"] = pkg_info_match.group(2)

    return versions


def _next_version(current: str, component: str) -> str:
    """Return the incremented semantic version."""
    match = VERSION_PATTERN.fullmatch(current)
    if match is None:
        raise ValueError(f"Version must use MAJOR.MINOR.PATCH, got {current!r}")

    major, minor, patch = (int(value) for value in match.groups())
    if component == "major":
        major, minor, patch = major + 1, 0, 0
    elif component == "minor":
        minor, patch = minor + 1, 0
    else:
        patch += 1
    return f"{major}.{minor}.{patch}"


def _write_json(path: Path, value: dict[str, object]) -> None:
    """Write consistently formatted JSON."""
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def increment_version(root: Path, component: str, dry_run: bool = False) -> str:
    """Validate, increment, and synchronize the project release version."""
    versions = _current_versions(root)
    unique_versions = set(versions.values())
    if len(unique_versions) != 1:
        details = ", ".join(f"{name}={value}" for name, value in versions.items())
        raise ValueError(f"Release versions are inconsistent: {details}")

    current = unique_versions.pop()
    new_version = _next_version(current, component)
    if dry_run:
        return new_version

    pyproject_path = root / "pyproject.toml"
    pyproject_text = pyproject_path.read_text(encoding="utf-8")
    pyproject_path.write_text(
        PYPROJECT_PATTERN.sub(
            lambda match: f"{match.group(1)}{new_version}{match.group(3)}",
            pyproject_text,
            count=1,
        ),
        encoding="utf-8",
    )

    manifest_path = (
        root / "custom_components" / "scheduled_climate" / "manifest.json"
    )
    manifest = _load_json(manifest_path)
    manifest["version"] = new_version
    _write_json(manifest_path, manifest)

    package_path = root / "frontend" / "package.json"
    package = _load_json(package_path)
    package["version"] = new_version
    _write_json(package_path, package)

    lock_path = root / "frontend" / "package-lock.json"
    lock = _load_json(lock_path)
    lock["version"] = new_version
    lock_packages = lock["packages"]
    assert isinstance(lock_packages, dict)
    lock_root = lock_packages[""]
    assert isinstance(lock_root, dict)
    lock_root["version"] = new_version
    _write_json(lock_path, lock)

    updated_versions = _current_versions(root, include_generated=False)
    if set(updated_versions.values()) != {new_version}:
        raise RuntimeError("Version synchronization verification failed")
    return new_version


def main() -> int:
    """Run the version increment command."""
    parser = argparse.ArgumentParser(
        description="Increment all Scheduled Climate release version declarations."
    )
    parser.add_argument(
        "component", nargs="?", choices=("major", "minor", "patch")
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the next version without changing files.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        help="Repository root; normally discovered from the script location.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify that all source and generated versions agree.",
    )
    args = parser.parse_args()

    root = args.root.resolve() if args.root else _project_root(Path(__file__))
    versions = _current_versions(root)
    if args.check:
        if args.component is not None or args.dry_run:
            parser.error("--check cannot be combined with a component or --dry-run")
        if len(set(versions.values())) != 1:
            details = ", ".join(
                f"{name}={value}" for name, value in versions.items()
            )
            raise ValueError(f"Release versions are inconsistent: {details}")
        print(f"All release versions agree at {next(iter(versions.values()))}")
        return 0
    if args.component is None:
        parser.error("component is required unless --check is used")

    current = next(iter(versions.values()))
    new_version = increment_version(root, args.component, args.dry_run)
    action = "Would increment" if args.dry_run else "Incremented"
    print(f"{action} Scheduled Climate from {current} to {new_version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
