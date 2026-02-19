import { Command, Options } from "@effect/cli";
import { Effect } from "effect";

import { generateReadmeFromConfig } from "#src/readme-generator/generator";

/**
 * Parsed arguments for the `generate` command.
 */
interface GenerateCommandArgs {
	/** Path to the input readie config file. */
	config: string;
	/** Optional output path override. */
	output: string;
	/** Enables dry-run mode without writing files. */
	dryRun: boolean;
	/** Disables discovery of `readie.global.json` when true. */
	noGlobal: boolean;
}

/**
 * Returns user-facing status text based on write and dry-run outcomes.
 */
const resultStatus = (updated: boolean, dryRun: boolean) => {
	if (!updated) {
		return "No changes";
	}
	return dryRun ? "Would update" : "Generated";
};

/**
 * CLI command that generates a README from a single `readie.json` file.
 */
export const generateCommand = Command.make(
	"generate",
	{
		config: Options.text("config").pipe(
			Options.withAlias("c"),
			Options.withDescription("Path to readie config file"),
			Options.withDefault("./readie.json")
		),
		dryRun: Options.boolean("dry-run").pipe(
			Options.withDescription("Show changes without writing files")
		),
		noGlobal: Options.boolean("no-global").pipe(
			Options.withDescription("Disable readie.global.json discovery and merge")
		),
		output: Options.text("output").pipe(
			Options.withAlias("o"),
			Options.withDescription("Optional output path for README"),
			Options.withDefault("")
		),
	},
	({ config, output, dryRun, noGlobal }: GenerateCommandArgs) =>
		Effect.gen(function* runGenerateCommand() {
			const result = yield* Effect.tryPromise({
				catch: (error: unknown) =>
					error instanceof Error
						? error
						: new Error(`Generation failed: ${String(error)}`),
				try: () =>
					generateReadmeFromConfig({
						configPath: config,
						dryRun,
						outputPath: output.trim().length > 0 ? output : undefined,
						useGlobalConfig: !noGlobal,
					}),
			});

			yield* Effect.sync(() => {
				const status = resultStatus(result.updated, dryRun);
				console.log(`${status}: ${result.outputPath}`);
			});
		})
).pipe(
	Command.withDescription(
		"Generate a README from a single readie.json config file."
	)
);
