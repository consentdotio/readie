import { Command, Options } from "@effect/cli";
import { Effect } from "effect";
import { resolve } from "pathe";

import {
  generateWorkspaceReadmes,
  parsePackageList,
} from "#src/readme-generator/generator";

interface GenerateWorkspaceCommandArgs {
  root: string;
  configName: string;
  packageValues: string[];
  dryRun: boolean;
  strict: boolean;
  noGlobal: boolean;
}

export const generateWorkspaceCommand = Command.make(
  "generate:workspace",
  {
    configName: Options.text("config-name").pipe(
      Options.withDescription("Config filename to search for in each project"),
      Options.withDefault("readie.json")
    ),
    dryRun: Options.boolean("dry-run").pipe(
      Options.withDescription("Show changes without writing files")
    ),
    noGlobal: Options.boolean("no-global").pipe(
      Options.withDescription("Disable readie.global.json discovery and merge")
    ),
    packageValues: Options.text("package").pipe(
      Options.withAlias("p"),
      Options.withDescription(
        "Project name filter (repeatable, comma-separated supported)"
      ),
      Options.repeated
    ),
    root: Options.directory("root").pipe(
      Options.withAlias("r"),
      Options.withDescription("Workspace root directory"),
      Options.withDefault(resolve("./packages"))
    ),
    strict: Options.boolean("strict").pipe(
      Options.withDescription("Exit with code 1 if any project fails")
    ),
  },
  ({
    root,
    configName,
    packageValues,
    dryRun,
    strict,
    noGlobal,
  }: GenerateWorkspaceCommandArgs) =>
    Effect.gen(function* runGenerateWorkspaceCommand() {
      const result = yield* Effect.tryPromise({
        catch: (error: unknown) =>
          error instanceof Error
            ? error
            : new Error(`Workspace generation failed: ${String(error)}`),
        try: () =>
          generateWorkspaceReadmes({
            configName,
            dryRun,
            packageFilter: parsePackageList(packageValues),
            rootDir: root,
            useGlobalConfig: !noGlobal,
          }),
      });

      yield* Effect.sync(() => {
        console.log("");
        console.log("Summary");
        console.log(`- Updated: ${result.updated.length}`);
        console.log(`- Unchanged: ${result.unchanged.length}`);
        console.log(`- Failed: ${result.failed.length}`);
        if (result.skippedByFilter.length > 0) {
          console.log(`- Skipped by filter: ${result.skippedByFilter.length}`);
        }
        if (strict && result.failed.length > 0) {
          process.exitCode = 1;
        }
      });
    })
).pipe(
  Command.withDescription(
    "Generate READMEs for projects inside a workspace root."
  )
);
