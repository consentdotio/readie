import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadReadieConfig } from '../src/config/load-config';

const createTempFile = async (contents: string) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'readie-test-'));
  const filePath = path.join(dir, 'readie.json');
  await fs.writeFile(filePath, contents, 'utf8');
  return filePath;
};

describe('loadReadieConfig', () => {
  it('loads a valid config', async () => {
    const configPath = await createTempFile(
      JSON.stringify({
        title: 'Test Project',
        description: 'Config validation test.',
      }),
    );

    const config = await loadReadieConfig(configPath);
    expect(config.title).toBe('Test Project');
  });

  it('throws for invalid config', async () => {
    const configPath = await createTempFile(
      JSON.stringify({
        description: 'Missing title should fail.',
      }),
    );

    await expect(loadReadieConfig(configPath)).rejects.toThrow('Configuration validation failed');
  });
});
