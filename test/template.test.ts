import { describe, expect, it } from 'vitest';
import { baseReadmeTemplate } from '../src/readme-generator/template';

describe('baseReadmeTemplate', () => {
  it('renders neutral markdown without c15t defaults', () => {
    const markdown = baseReadmeTemplate({
      title: 'Readie Demo',
      description: 'A neutral README.',
      includeTableOfContents: true,
      features: ['Fast', 'Simple'],
      installation: ['```bash\nnpm install readie-demo\n```'],
      usage: ['Run the command', '```bash\nnpx readie\n```'],
      security: 'Please report issues privately.',
    });

    expect(markdown).toContain('# Readie Demo');
    expect(markdown).toContain('## Table of Contents');
    expect(markdown).toContain('## Key Features');
    expect(markdown).toContain('## Security');
    expect(markdown).not.toContain('c15t');
    expect(markdown).not.toContain('consent.io');
  });
});
