#!/usr/bin/env node

import { Command, ValidationError } from '@effect/cli';
import * as NodeContext from '@effect/platform-node/NodeContext';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Effect } from 'effect';
import { generateCommand } from './cli/commands/generate.js';
import { generateWorkspaceCommand } from './cli/commands/generate-workspace.js';
import { initCommand } from './cli/commands/init.js';
import { printRootHelp } from './cli/help.js';
import { resolveInvocation } from './cli/resolve-invocation.js';

const version = '0.1.0';

const runGenerate = (args: string[]) =>
  Command.run(generateCommand, {
    name: 'readie',
    version,
  })(args).pipe(Effect.provide(NodeContext.layer));

const runGenerateWorkspace = (args: string[]) =>
  Command.run(generateWorkspaceCommand, {
    name: 'readie',
    version,
  })(args).pipe(Effect.provide(NodeContext.layer));

const runInit = (args: string[]) =>
  Command.run(initCommand, {
    name: 'readie',
    version,
  })(args).pipe(Effect.provide(NodeContext.layer));

const resolved = resolveInvocation(process.argv.slice(2));

if (resolved.mode === 'help') {
  printRootHelp();
  process.exit(0);
}

if (resolved.mode === 'unknown') {
  printRootHelp();
  process.exit(1);
}

const commandEffect =
  resolved.mode === 'generate'
    ? runGenerate(resolved.commandArgs)
    : resolved.mode === 'generate:workspace'
      ? runGenerateWorkspace(resolved.commandArgs)
      : runInit(resolved.commandArgs);

const program = commandEffect.pipe(
  Effect.catchIf(
    (error): error is ValidationError.ValidationError => ValidationError.isValidationError(error),
    (error) =>
      Effect.sync(() => {
        console.error(String(error));
        process.exitCode = 1;
      }),
  ),
  Effect.catchAll((error) =>
    Effect.sync(() => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }),
  ),
);

NodeRuntime.runMain(program);
