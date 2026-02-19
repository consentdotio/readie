import { Command, Options } from '@effect/cli';
import { Effect } from 'effect';
import { generateReadmeFromConfig } from '../../readme-generator/generator.js';

interface GenerateCommandArgs {
  config: string;
  output: string;
  dryRun: boolean;
  noGlobal: boolean;
}

export const generateCommand = Command.make(
  'generate',
  {
    config: Options.text('config').pipe(
      Options.withAlias('c'),
      Options.withDescription('Path to readie config file'),
      Options.withDefault('./readie.json'),
    ),
    output: Options.text('output').pipe(
      Options.withAlias('o'),
      Options.withDescription('Optional output path for README'),
      Options.withDefault(''),
    ),
    dryRun: Options.boolean('dry-run').pipe(Options.withDescription('Show changes without writing files')),
    noGlobal: Options.boolean('no-global').pipe(
      Options.withDescription('Disable readie.global.json discovery and merge'),
    ),
  },
  ({ config, output, dryRun, noGlobal }: GenerateCommandArgs) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          generateReadmeFromConfig({
            configPath: config,
            outputPath: output.trim().length > 0 ? output : undefined,
            dryRun,
            useGlobalConfig: !noGlobal,
          }),
        catch: (error: unknown) =>
          error instanceof Error ? error : new Error(`Generation failed: ${String(error)}`),
      });

      yield* Effect.sync(() => {
        const status = result.updated ? (dryRun ? 'Would update' : 'Generated') : 'No changes';
        console.log(`${status}: ${result.outputPath}`);
      });
    }),
).pipe(
  Command.withDescription('Generate a README from a single readie.json config file.'),
);
