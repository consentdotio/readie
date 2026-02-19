import fs from 'node:fs/promises';
import path from 'node:path';
import { Schema } from 'effect';
import type { ReadieConfig, ReadieGlobalConfig } from './types.js';

const commandSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
});

const globalFlagSchema = Schema.Struct({
  flag: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
});

const badgeSchema = Schema.Struct({
  label: Schema.NonEmptyString,
  image: Schema.NonEmptyString,
  link: Schema.optional(Schema.NonEmptyString),
});

const licenseSchema = Schema.Union(
  Schema.NonEmptyString,
  Schema.Struct({
    name: Schema.NonEmptyString,
    url: Schema.NonEmptyString,
  }),
);

const readieConfigSchema = Schema.Struct({
  $schema: Schema.optional(Schema.String),
  version: Schema.optional(Schema.Literal('1')),
  title: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
  output: Schema.optional(Schema.String),
  includeTableOfContents: Schema.optional(Schema.Boolean),
  features: Schema.optional(Schema.Array(Schema.String)),
  prerequisites: Schema.optional(Schema.Array(Schema.String)),
  installation: Schema.optional(Schema.Array(Schema.String)),
  manualInstallation: Schema.optional(Schema.Array(Schema.String)),
  usage: Schema.optional(Schema.Array(Schema.String)),
  commands: Schema.optional(Schema.Array(commandSchema)),
  globalFlags: Schema.optional(Schema.Array(globalFlagSchema)),
  badges: Schema.optional(Schema.Array(badgeSchema)),
  banner: Schema.optional(Schema.String),
  quickStart: Schema.optional(Schema.String),
  support: Schema.optional(Schema.Array(Schema.String)),
  contributing: Schema.optional(Schema.Array(Schema.String)),
  security: Schema.optional(Schema.String),
  license: Schema.optional(licenseSchema),
  footer: Schema.optional(Schema.String),
  docsLink: Schema.optional(Schema.String),
  quickStartLink: Schema.optional(Schema.String),
  customSections: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.String,
    }),
  ),
});

const readieGlobalConfigSchema = Schema.Struct({
  $schema: Schema.optional(Schema.String),
  version: Schema.optional(Schema.Literal('1')),
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NonEmptyString),
  output: Schema.optional(Schema.String),
  includeTableOfContents: Schema.optional(Schema.Boolean),
  features: Schema.optional(Schema.Array(Schema.String)),
  prerequisites: Schema.optional(Schema.Array(Schema.String)),
  installation: Schema.optional(Schema.Array(Schema.String)),
  manualInstallation: Schema.optional(Schema.Array(Schema.String)),
  usage: Schema.optional(Schema.Array(Schema.String)),
  commands: Schema.optional(Schema.Array(commandSchema)),
  globalFlags: Schema.optional(Schema.Array(globalFlagSchema)),
  badges: Schema.optional(Schema.Array(badgeSchema)),
  banner: Schema.optional(Schema.String),
  quickStart: Schema.optional(Schema.String),
  support: Schema.optional(Schema.Array(Schema.String)),
  contributing: Schema.optional(Schema.Array(Schema.String)),
  security: Schema.optional(Schema.String),
  license: Schema.optional(licenseSchema),
  footer: Schema.optional(Schema.String),
  docsLink: Schema.optional(Schema.String),
  quickStartLink: Schema.optional(Schema.String),
  customSections: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.String,
    }),
  ),
});

const decodeReadieConfig = Schema.decodeUnknownSync(readieConfigSchema);
const decodeReadieGlobalConfig = Schema.decodeUnknownSync(readieGlobalConfigSchema);

const GLOBAL_CONFIG_NAME = 'readie.global.json';

const parseJsonFile = async (absolutePath: string): Promise<unknown> => {
  const raw = await fs.readFile(absolutePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON in ${absolutePath}: ${message}`);
  }
};

export const loadReadieConfig = async (configPath: string): Promise<ReadieConfig> => {
  const absolutePath = path.resolve(configPath);
  const parsed = await parseJsonFile(absolutePath);

  try {
    return decodeReadieConfig(parsed) as ReadieConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Configuration validation failed for ${absolutePath}\n${message}`);
  }
};

const loadGlobalReadieConfig = async (configPath: string): Promise<ReadieGlobalConfig> => {
  const absolutePath = path.resolve(configPath);
  const parsed = await parseJsonFile(absolutePath);

  try {
    return decodeReadieGlobalConfig(parsed) as ReadieGlobalConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Global configuration validation failed for ${absolutePath}\n${message}`);
  }
};

export const loadGlobalConfig = async (startDir: string): Promise<ReadieGlobalConfig | null> => {
  let current = path.resolve(startDir);

  while (true) {
    const candidate = path.join(current, GLOBAL_CONFIG_NAME);
    try {
      await fs.access(candidate);
      return await loadGlobalReadieConfig(candidate);
    } catch {
      // Keep walking up until filesystem root.
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
};

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

const interpolateTitlePlaceholder = (value: string, title: string): string =>
  value.replace(/\{\{\s*title\s*\}\}/g, title);

const interpolateTopLevelStrings = (config: ReadieConfig): ReadieConfig => {
  const interpolated = { ...config } as Record<string, unknown>;

  for (const [key, value] of Object.entries(interpolated)) {
    if (typeof value === 'string') {
      interpolated[key] = interpolateTitlePlaceholder(value, config.title);
    }
  }

  return interpolated as ReadieConfig;
};

const resolveMergedValue = <T>(
  key: keyof ReadieConfig,
  projectConfig: ReadieConfig,
  globalConfig: ReadieGlobalConfig | null,
): T | undefined => {
  const project = projectConfig as unknown as Record<string, unknown>;
  const global = (globalConfig ?? {}) as Record<string, unknown>;

  if (hasOwn(project, key)) {
    const projectValue = project[key];
    return projectValue === null ? undefined : (projectValue as T);
  }

  const globalValue = global[key];
  return globalValue === null ? undefined : (globalValue as T | undefined);
};

export const mergeConfigs = (
  globalConfig: ReadieGlobalConfig | null,
  projectConfig: ReadieConfig,
): ReadieConfig => {
  const mergedCustomSections = (() => {
    const project = projectConfig as unknown as Record<string, unknown>;
    const global = (globalConfig ?? {}) as Record<string, unknown>;

    if (hasOwn(project, 'customSections')) {
      const projectCustomSections = project.customSections;
      if (projectCustomSections === null) {
        return undefined;
      }
      if (typeof projectCustomSections === 'object' && projectCustomSections !== null) {
        return {
          ...((global.customSections as Record<string, string> | undefined) ?? {}),
          ...(projectCustomSections as Record<string, string>),
        };
      }
      return undefined;
    }

    if (typeof global.customSections === 'object' && global.customSections !== null) {
      return global.customSections as Record<string, string>;
    }

    return undefined;
  })();

  const merged: ReadieConfig = {
    title: projectConfig.title,
    description: projectConfig.description,
    $schema: resolveMergedValue('$schema', projectConfig, globalConfig),
    version: resolveMergedValue('version', projectConfig, globalConfig),
    output: resolveMergedValue('output', projectConfig, globalConfig),
    includeTableOfContents: resolveMergedValue('includeTableOfContents', projectConfig, globalConfig),
    features: resolveMergedValue('features', projectConfig, globalConfig),
    prerequisites: resolveMergedValue('prerequisites', projectConfig, globalConfig),
    installation: resolveMergedValue('installation', projectConfig, globalConfig),
    manualInstallation: resolveMergedValue('manualInstallation', projectConfig, globalConfig),
    usage: resolveMergedValue('usage', projectConfig, globalConfig),
    commands: resolveMergedValue('commands', projectConfig, globalConfig),
    globalFlags: resolveMergedValue('globalFlags', projectConfig, globalConfig),
    badges: resolveMergedValue('badges', projectConfig, globalConfig),
    banner: resolveMergedValue('banner', projectConfig, globalConfig),
    quickStart: resolveMergedValue('quickStart', projectConfig, globalConfig),
    support: resolveMergedValue('support', projectConfig, globalConfig),
    contributing: resolveMergedValue('contributing', projectConfig, globalConfig),
    security: resolveMergedValue('security', projectConfig, globalConfig),
    license: resolveMergedValue('license', projectConfig, globalConfig),
    footer: resolveMergedValue('footer', projectConfig, globalConfig),
    docsLink: resolveMergedValue('docsLink', projectConfig, globalConfig),
    quickStartLink: resolveMergedValue('quickStartLink', projectConfig, globalConfig),
    customSections: mergedCustomSections,
  };

  return interpolateTopLevelStrings(merged);
};
