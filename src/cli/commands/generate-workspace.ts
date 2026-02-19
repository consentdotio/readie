import path from 'node:path';
import { Command, Options } from '@effect/cli';
import { Effect } from 'effect';
import { generateWorkspaceReadmes, parsePackageList } from '../../readme-generator/generator.js';

interface GenerateWorkspaceCommandArgs {
  root: string;
  configName: string;
  packageValues: string[];
  dryRun: boolean;
  strict: boolean;
  noGlobal: boolean;
}

export const generateWorkspaceCommand = Command.make(
  'generate:workspace',
  {
    root: Options.directory('root').pipe(
      Options.withAlias('r'),
      Options.withDescription('Workspace root directory'),
      Options.withDefault(path.resolve('./packages')),
    ),
    configName: Options.text('config-name').pipe(
      Options.withDescription('Config filename to search for in each project'),
      Options.withDefault('readie.json'),
    ),
    packageValues: Options.text('package').pipe(
      Options.withAlias('p'),
      Options.withDescription('Project name filter (repeatable, comma-separated supported)'),
      Options.repeated,
    ),
    dryRun: Options.boolean('dry-run').pipe(Options.withDescription('Show changes without writing files')),
    strict: Options.boolean('strict').pipe(Options.withDescription('Exit with code 1 if any project fails')),
    noGlobal: Options.boolean('no-global').pipe(
      Options.withDescription('Disable readie.global.json discovery and merge'),
    ),
  },
  ({ root, configName, packageValues, dryRun, strict, noGlobal }: GenerateWorkspaceCommandArgs) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          generateWorkspaceReadmes({
            rootDir: root,
            configName,
            packageFilter: parsePackageList(packageValues),
            dryRun,
            useGlobalConfig: !noGlobal,
          }),
        catch: (error: unknown) =>
          error instanceof Error ? error : new Error(`Workspace generation failed: ${String(error)}`),
      });

      yield* Effect.sync(() => {
        console.log('');
        console.log('Summary');
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
    }),
).pipe(
  Command.withDescription('Generate READMEs for projects inside a workspace root.'),
);
