#!/usr/bin/env node

import { Command, ValidationError } from "@effect/cli";
import * as NodeContext from "@effect/platform-node/NodeContext";
import { Effect } from "effect";

import { generateCommand } from "./cli/commands/generate";
import { generateWorkspaceCommand } from "./cli/commands/generate-workspace";
import { initCommand } from "./cli/commands/init";
import { printRootHelp } from "./cli/help";
import { resolveInvocation } from "./cli/resolve-invocation";

const version = "0.0.1";

const runGenerate = (args: string[]) =>
	Command.run(generateCommand, {
		name: "readie",
		version,
	})(args).pipe(Effect.provide(NodeContext.layer));

const runGenerateWorkspace = (args: string[]) =>
	Command.run(generateWorkspaceCommand, {
		name: "readie",
		version,
	})(args).pipe(Effect.provide(NodeContext.layer));

const runInit = (args: string[]) =>
	Command.run(initCommand, {
		name: "readie",
		version,
	})(args).pipe(Effect.provide(NodeContext.layer));

const selectCommandEffect = (
	resolved: ReturnType<typeof resolveInvocation>
) => {
	if (resolved.mode === "generate") {
		return runGenerate(resolved.commandArgs);
	}
	if (resolved.mode === "generate:workspace") {
		return runGenerateWorkspace(resolved.commandArgs);
	}
	if (resolved.mode === "init") {
		return runInit(resolved.commandArgs);
	}
	throw new Error(`Unsupported invocation mode: ${resolved.mode}`);
};

const handleError = (error: unknown) => {
	if (ValidationError.isValidationError(error)) {
		console.error(String(error));
		process.exitCode = 1;
		return;
	}

	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
};

const main = async () => {
	const resolved = resolveInvocation(process.argv.slice(2));

	if (resolved.mode === "help") {
		printRootHelp();
		process.exit(0);
	}
	if (resolved.mode === "unknown") {
		printRootHelp();
		process.exit(1);
	}

	try {
		await Effect.runPromise(selectCommandEffect(resolved));
	} catch (error) {
		handleError(error);
	}
};

await main();
