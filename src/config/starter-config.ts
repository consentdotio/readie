import type { ReadieConfig } from './types.js';

export const DEFAULT_SCHEMA_URL = 'https://unpkg.com/readie/schemas/readie.schema.json';

export const starterConfig: ReadieConfig = {
  $schema: DEFAULT_SCHEMA_URL,
  version: '1',
  title: 'My Project',
  description: 'A short description of what this project does.',
  includeTableOfContents: true,
  features: ['Fast setup', 'Clear docs', 'Simple CLI usage'],
  installation: ['```bash\nnpm install my-project\n```'],
  usage: ['Explain basic usage in a few steps.', '```bash\nnpm run start\n```'],
  docsLink: 'https://example.com/docs',
};

export const starterConfigText = `${JSON.stringify(starterConfig, null, 2)}\n`;
