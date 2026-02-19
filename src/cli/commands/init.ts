import * as fssync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Command, Options } from '@effect/cli';
import { Effect } from 'effect';
import { starterConfigText } from '../../config/starter-config.js';

interface InitCommandArgs {
  config: string;
  force: boolean;
}

export const initCommand = Command.make(
  'init',
  {
    config: Options.text('config').pipe(
      Options.withAlias('c'),
      Options.withDescription('Path for generated starter config'),
      Options.withDefault('./readie.json'),
    ),
    force: Options.boolean('force').pipe(
      Options.withAlias('f'),
      Options.withDescription('Overwrite existing config file if it exists'),
    ),
  },
  ({ config, force }: InitCommandArgs) =>
    Effect.gen(function* () {
      const configPath = path.resolve(config);
      const exists = fssync.existsSync(configPath);

      if (exists && !force) {
        yield* Effect.fail(new Error(`Config already exists at ${configPath}. Use --force to overwrite.`));
      }

      yield* Effect.tryPromise({
        try: () => fs.writeFile(configPath, starterConfigText, 'utf8'),
        catch: (error: unknown) =>
          error instanceof Error ? error : new Error(`Failed to write config: ${String(error)}`),
      });

      yield* Effect.sync(() => {
        console.log(`Created starter config: ${configPath}`);
      });
    }),
).pipe(
  Command.withDescription('Create a starter readie.json file in the current directory.'),
);
