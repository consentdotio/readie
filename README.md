# Readie

Developer-first CLI for generating polished, consistent README files from a simple config.

## Table of Contents

- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Installation](#manual-installation)
- [Usage](#usage)
- [Available Commands](#available-commands)
- [Global Flags](#global-flags)
- [Documentation](#documentation)

## Key Features

- Generate a single project README or many READMEs across a workspace
- Schema-backed configuration with editor autocomplete and validation
- Composable sections for installation, quick start, commands, flags, and more
- Supports custom markdown sections, badges, and project-specific content
- Easy onboarding with starter config generation
- Dry-run and strict workspace options for safe large-scale updates

## Prerequisites

- Node.js 18 or later
- npm, pnpm, or yarn
- A project with a `readie.json` config file

## Quick Start

Create a starter config and generate your README in minutes:

```bash
# 1) Initialize a config
npx readie init

# 2) Generate README.md from readie.json
npx readie
```

For monorepos/workspaces:

```bash
npx readie generate:workspace --root ./packages --config-name readie.json
```

This workflow helps teams keep README files consistent while still allowing per-project customization.

## Manual Installation

```bash
npm install -g readie
```

You can also run it without global install via `npx readie`.

## Usage

1. Create a config file with `npx readie init`.
2. Run `npx readie` (or `npx readie generate`) to generate one README.
3. Use `npx readie generate:workspace --root ./packages` to generate for multiple packages.
4. Use `--dry-run` to preview changes and `--strict` to fail CI on generation errors.
5. Extend generated docs with rich markdown via `quickStart`, `customSections`, and `footer`.
6. Use placeholders in top-level strings of `readie.global.json`: `{{title}}`, `{{packageName}}`, and `{{packageNameEncoded}}`.

```json
{
	"banner": "<h1 align=\"center\">{{title}}</h1>",
	"footer": "https://example.com?ref={{packageNameEncoded}}"
}
```

```bash
# Single project
npx readie --config ./readie.json

# Workspace with package filtering
npx readie generate:workspace --root ./packages --package ui --package api --dry-run
```

## Available Commands

- `readie`: Generate a README from the local readie.json (default command).
- `readie generate`: Explicit single-project generation command.
- `readie generate:workspace`: Generate READMEs for multiple projects in a workspace.
- `readie init`: Create a starter readie.json in the current directory.

## Global Flags

- `--help, -h`: Show command help.
- `--config, -c`: Set a custom config path for supported commands.

## Documentation

For further information, guides, and examples visit the [reference documentation](https://github.com/readie-cli/readie).
