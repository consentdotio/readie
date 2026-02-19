/**
 * Describes a CLI command that should be rendered in generated README content.
 */
export interface ReadieCommand {
	/** Command name shown in the README command list. */
	name: string;
	/** Short description of what the command does. */
	description: string;
}

/**
 * Describes a global flag that should be rendered in generated README content.
 */
export interface ReadieFlag {
	/** Flag token such as `--dry-run`. */
	flag: string;
	/** Short description of the flag behavior. */
	description: string;
}

/**
 * Represents a README badge image with an optional click-through link.
 */
export interface ReadieBadge {
	/** Accessible label used as badge alt text. */
	label: string;
	/** Badge image URL. */
	image: string;
	/** Optional link URL wrapped around the badge image. */
	link?: string;
}

/**
 * Represents a license entry rendered as a linked label.
 */
export interface ReadieLicenseObject {
	/** Display name of the license. */
	name: string;
	/** URL to the full license text or page. */
	url: string;
}

/**
 * License configuration accepted by readie.
 */
export type ReadieLicense = string | ReadieLicenseObject;

/**
 * Defines all supported fields for a project-level `readie.json` file.
 */
export interface ReadieConfig {
	/** Optional JSON schema URL for editor tooling. */
	$schema?: string;
	/** Config format version. */
	version?: "1";
	/** Project title rendered as the README H1 when no banner H1 exists. */
	title: string;
	/** Primary project description paragraph. */
	description: string;
	/** Optional output path for generated README content. */
	output?: string;
	/** Controls whether a table of contents section is rendered. */
	includeTableOfContents?: boolean;
	/** Feature bullets rendered in the Key Features section. */
	features?: string[];
	/** Prerequisite bullets required before usage or installation. */
	prerequisites?: string[];
	/** Installation steps, typically command snippets. */
	installation?: string[];
	/** Optional manual installation steps separate from standard install. */
	manualInstallation?: string[];
	/** Usage steps rendered as numbered entries with code blocks support. */
	usage?: string[];
	/** Command metadata rendered in the Available Commands section. */
	commands?: ReadieCommand[];
	/** Global CLI flag metadata rendered in the Global Flags section. */
	globalFlags?: ReadieFlag[];
	/** Badge metadata rendered near the top of the README. */
	badges?: ReadieBadge[];
	/** Optional markdown/HTML block rendered before the title. */
	banner?: string;
	/** Quick start markdown block. */
	quickStart?: string;
	/** Support bullets for where users can get help. */
	support?: string[];
	/** Contributing bullets for contribution workflow notes. */
	contributing?: string[];
	/** Security section content such as disclosure guidance. */
	security?: string;
	/** License section content as text or linked object form. */
	license?: ReadieLicense;
	/** Optional footer content appended at the end of the README. */
	footer?: string;
	/** Link used to render the Documentation section. */
	docsLink?: string;
	/** Link used to render the Additional Quick Start section. */
	quickStartLink?: string;
	/** Additional custom sections keyed by heading title. */
	customSections?: Record<string, string>;
}

/**
 * Defines optional defaults loaded from `readie.global.json`.
 */
export type ReadieGlobalConfig = Partial<ReadieConfig>;

/**
 * Options for generating a single README from one config file.
 */
export interface GenerateSingleOptions {
	/** Path to the input `readie.json` file. */
	configPath: string;
	/** Optional explicit output path that overrides config output. */
	outputPath?: string;
	/** If true, computes changes without writing files. */
	dryRun: boolean;
	/** If false, disables `readie.global.json` discovery and merge. */
	useGlobalConfig?: boolean;
}

/**
 * Result of generating a single README file.
 */
export interface GenerateSingleResult {
	/** Resolved path where README content was written or would be written. */
	outputPath: string;
	/** Whether generated content differs from existing file content. */
	updated: boolean;
}

/**
 * Options for generating README files across workspace projects.
 */
export interface GenerateWorkspaceOptions {
	/** Workspace root directory containing project subdirectories. */
	rootDir: string;
	/** Config file name to search for in each project directory. */
	configName: string;
	/** Optional package-name filter for selecting projects. */
	packageFilter: Set<string>;
	/** If true, computes changes without writing files. */
	dryRun: boolean;
	/** If false, disables `readie.global.json` discovery and merge. */
	useGlobalConfig?: boolean;
}

/**
 * Represents a failed workspace project generation attempt.
 */
export interface GenerateWorkspaceFailure {
	/** Absolute project directory path that failed generation. */
	projectDir: string;
	/** Original error value captured during project processing. */
	error: unknown;
}

/**
 * Aggregated outcome from a workspace generation run.
 */
export interface GenerateWorkspaceResult {
	/** Project names whose README files were created or changed. */
	updated: string[];
	/** Project names whose README content was already up to date. */
	unchanged: string[];
	/** Projects that failed with the associated error payload. */
	failed: GenerateWorkspaceFailure[];
	/** Project names skipped because they were filtered out by package flags. */
	skippedByFilter: string[];
}
