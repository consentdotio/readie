import { describe, expect, it } from 'vitest';
import { mergeConfigs } from '../src/config/load-config';
import type { ReadieConfig, ReadieGlobalConfig } from '../src/config/types';

const createProjectConfig = (overrides: Partial<ReadieConfig> = {}): ReadieConfig => ({
  title: 'My Package',
  description: 'Project level description.',
  ...overrides,
});

describe('mergeConfigs', () => {
  it('interpolates {{title}} in top-level global string fields', () => {
    const globalConfig: ReadieGlobalConfig = {
      banner: '<h1 align="center">{{title}}</h1>',
      footer: 'Built by {{ title }}',
      features: ['Feature A'],
      customSections: {
        Notes: 'Package: {{title}}',
      },
    };

    const merged = mergeConfigs(globalConfig, createProjectConfig());

    expect(merged.banner).toBe('<h1 align="center">My Package</h1>');
    expect(merged.footer).toBe('Built by My Package');
    expect(merged.features).toEqual(['Feature A']);
    expect(merged.customSections?.Notes).toBe('Package: {{title}}');
  });

  it('preserves project-over-global precedence before interpolation', () => {
    const globalConfig: ReadieGlobalConfig = {
      banner: 'Global banner {{title}}',
      quickStart: 'Global quick start',
    };

    const projectConfig = createProjectConfig({
      banner: 'Project banner',
      quickStart: 'Project quick start for {{title}}',
    });

    const merged = mergeConfigs(globalConfig, projectConfig);

    expect(merged.banner).toBe('Project banner');
    expect(merged.quickStart).toBe('Project quick start for My Package');
  });
});
