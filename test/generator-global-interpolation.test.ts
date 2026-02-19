import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateReadmeFromConfig } from '../src/readme-generator/generator';

const writeJson = async (filePath: string, value: unknown) => {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
};

describe('generateReadmeFromConfig with global interpolation', () => {
  it('injects title and package placeholders in global config', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'readie-global-'));
    const packageDir = path.join(rootDir, 'packages', 'react');
    await fs.mkdir(packageDir, { recursive: true });

    await writeJson(path.join(rootDir, 'readie.global.json'), {
      banner: '<h1 align="center">{{title}}</h1>',
      footer: 'Built for {{ title }} ({{packageNameEncoded}})',
    });

    await writeJson(path.join(packageDir, 'package.json'), {
      name: '@c15t/react',
      version: '1.0.0',
    });

    const configPath = path.join(packageDir, 'readie.json');
    await writeJson(configPath, {
      title: '@c15t/react: React Consent Components',
      description: 'CMP for React',
    });

    const result = await generateReadmeFromConfig({
      configPath,
      dryRun: false,
    });

    const generated = await fs.readFile(result.outputPath, 'utf8');

    expect(generated).toContain('<h1 align="center">@c15t/react: React Consent Components</h1>');
    expect(generated).toContain('Built for @c15t/react: React Consent Components (%40c15t%2Freact)');
  });
});
