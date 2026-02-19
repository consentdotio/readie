export interface ReadieCommand {
  name: string;
  description: string;
}

export interface ReadieFlag {
  flag: string;
  description: string;
}

export interface ReadieBadge {
  label: string;
  image: string;
  link?: string;
}

export interface ReadieLicenseObject {
  name: string;
  url: string;
}

export type ReadieLicense = string | ReadieLicenseObject;

export interface ReadieConfig {
  $schema?: string;
  version?: "1";
  title: string;
  description: string;
  output?: string;
  includeTableOfContents?: boolean;
  features?: string[];
  prerequisites?: string[];
  installation?: string[];
  manualInstallation?: string[];
  usage?: string[];
  commands?: ReadieCommand[];
  globalFlags?: ReadieFlag[];
  badges?: ReadieBadge[];
  banner?: string;
  quickStart?: string;
  support?: string[];
  contributing?: string[];
  security?: string;
  license?: ReadieLicense;
  footer?: string;
  docsLink?: string;
  quickStartLink?: string;
  customSections?: Record<string, string>;
}

export type ReadieGlobalConfig = Partial<ReadieConfig>;

export interface GenerateSingleOptions {
  configPath: string;
  outputPath?: string;
  dryRun: boolean;
  useGlobalConfig?: boolean;
}

export interface GenerateSingleResult {
  outputPath: string;
  updated: boolean;
}

export interface GenerateWorkspaceOptions {
  rootDir: string;
  configName: string;
  packageFilter: Set<string>;
  dryRun: boolean;
  useGlobalConfig?: boolean;
}

export interface GenerateWorkspaceResult {
  updated: string[];
  unchanged: string[];
  failed: { projectDir: string; error: unknown }[];
  skippedByFilter: string[];
}
