import { Schema } from "effect";
import { pathExists, readFile } from "fs-extra";
import { dirname, join, resolve } from "pathe";

import type { ReadieConfig, ReadieGlobalConfig } from "./types";

const commandSchema = Schema.Struct({
	description: Schema.NonEmptyString,
	name: Schema.NonEmptyString,
});

const globalFlagSchema = Schema.Struct({
	description: Schema.NonEmptyString,
	flag: Schema.NonEmptyString,
});

const badgeSchema = Schema.Struct({
	image: Schema.NonEmptyString,
	label: Schema.NonEmptyString,
	link: Schema.optional(Schema.NonEmptyString),
});

const licenseSchema = Schema.Union(
	Schema.NonEmptyString,
	Schema.Struct({
		name: Schema.NonEmptyString,
		url: Schema.NonEmptyString,
	})
);

const readieConfigSchema = Schema.Struct({
	$schema: Schema.optional(Schema.String),
	badges: Schema.optional(Schema.Array(badgeSchema)),
	banner: Schema.optional(Schema.String),
	commands: Schema.optional(Schema.Array(commandSchema)),
	contributing: Schema.optional(Schema.Array(Schema.String)),
	customSections: Schema.optional(
		Schema.Record({
			key: Schema.String,
			value: Schema.String,
		})
	),
	description: Schema.NonEmptyString,
	docsLink: Schema.optional(Schema.String),
	features: Schema.optional(Schema.Array(Schema.String)),
	footer: Schema.optional(Schema.String),
	globalFlags: Schema.optional(Schema.Array(globalFlagSchema)),
	includeTableOfContents: Schema.optional(Schema.Boolean),
	installation: Schema.optional(Schema.Array(Schema.String)),
	license: Schema.optional(licenseSchema),
	manualInstallation: Schema.optional(Schema.Array(Schema.String)),
	output: Schema.optional(Schema.String),
	prerequisites: Schema.optional(Schema.Array(Schema.String)),
	quickStart: Schema.optional(Schema.String),
	quickStartLink: Schema.optional(Schema.String),
	security: Schema.optional(Schema.String),
	support: Schema.optional(Schema.Array(Schema.String)),
	title: Schema.NonEmptyString,
	usage: Schema.optional(Schema.Array(Schema.String)),
	version: Schema.optional(Schema.Literal("1")),
});

const readieGlobalConfigSchema = Schema.Struct({
	$schema: Schema.optional(Schema.String),
	badges: Schema.optional(Schema.Array(badgeSchema)),
	banner: Schema.optional(Schema.String),
	commands: Schema.optional(Schema.Array(commandSchema)),
	contributing: Schema.optional(Schema.Array(Schema.String)),
	customSections: Schema.optional(
		Schema.Record({
			key: Schema.String,
			value: Schema.String,
		})
	),
	description: Schema.optional(Schema.NonEmptyString),
	docsLink: Schema.optional(Schema.String),
	features: Schema.optional(Schema.Array(Schema.String)),
	footer: Schema.optional(Schema.String),
	globalFlags: Schema.optional(Schema.Array(globalFlagSchema)),
	includeTableOfContents: Schema.optional(Schema.Boolean),
	installation: Schema.optional(Schema.Array(Schema.String)),
	license: Schema.optional(licenseSchema),
	manualInstallation: Schema.optional(Schema.Array(Schema.String)),
	output: Schema.optional(Schema.String),
	prerequisites: Schema.optional(Schema.Array(Schema.String)),
	quickStart: Schema.optional(Schema.String),
	quickStartLink: Schema.optional(Schema.String),
	security: Schema.optional(Schema.String),
	support: Schema.optional(Schema.Array(Schema.String)),
	title: Schema.optional(Schema.NonEmptyString),
	usage: Schema.optional(Schema.Array(Schema.String)),
	version: Schema.optional(Schema.Literal("1")),
});

const decodeReadieConfig = Schema.decodeUnknownSync(readieConfigSchema);
const decodeReadieGlobalConfig = Schema.decodeUnknownSync(
	readieGlobalConfigSchema
);

const GLOBAL_CONFIG_NAME = "readie.global.json";

const parseJsonFile = async (absolutePath: string): Promise<unknown> => {
	const raw = await readFile(absolutePath, "utf8");
	try {
		return JSON.parse(raw);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to parse JSON in ${absolutePath}: ${message}`, {
			cause: error,
		});
	}
};

export const loadReadieConfig = async (
	configPath: string
): Promise<ReadieConfig> => {
	const absolutePath = resolve(configPath);
	const parsed = await parseJsonFile(absolutePath);

	try {
		return decodeReadieConfig(parsed) as ReadieConfig;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Configuration validation failed for ${absolutePath}\n${message}`,
			{ cause: error }
		);
	}
};

const loadGlobalReadieConfig = async (
	configPath: string
): Promise<ReadieGlobalConfig> => {
	const absolutePath = resolve(configPath);
	const parsed = await parseJsonFile(absolutePath);

	try {
		return decodeReadieGlobalConfig(parsed) as ReadieGlobalConfig;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Global configuration validation failed for ${absolutePath}\n${message}`,
			{ cause: error }
		);
	}
};

export const loadGlobalConfig = async (
	startDir: string
): Promise<ReadieGlobalConfig | null> => {
	let current = resolve(startDir);

	while (true) {
		const candidate = join(current, GLOBAL_CONFIG_NAME);
		if (await pathExists(candidate)) {
			return await loadGlobalReadieConfig(candidate);
		}

		const parent = dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}
};

const hasOwn = (obj: object, key: string): boolean => Object.hasOwn(obj, key);

interface InterpolationContext {
	packageName?: string;
}

const interpolatePlaceholders = (
	value: string,
	placeholders: Record<string, string>
): string =>
	value.replaceAll(
		/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
		(match, key: string) => placeholders[key] ?? match
	);

const createInterpolationPlaceholders = (
	config: ReadieConfig,
	interpolationContext: InterpolationContext
): Record<string, string> => {
	const resolvedPackageName =
		interpolationContext.packageName?.trim() || config.title;

	return {
		packageName: resolvedPackageName,
		packageNameEncoded: encodeURIComponent(resolvedPackageName),
		title: config.title,
	};
};

const interpolateCustomSections = (
	customSections: Record<string, string> | undefined,
	placeholders: Record<string, string>
): Record<string, string> | undefined => {
	if (!customSections) {
		return;
	}

	const interpolatedSections: Record<string, string> = {};
	for (const [key, value] of Object.entries(customSections)) {
		interpolatedSections[key] = interpolatePlaceholders(value, placeholders);
	}
	return interpolatedSections;
};

const interpolateTopLevelStrings = (
	config: ReadieConfig,
	interpolationContext: InterpolationContext
): ReadieConfig => {
	const placeholders = createInterpolationPlaceholders(
		config,
		interpolationContext
	);
	const interpolated = { ...config } as Record<string, unknown>;

	for (const [key, value] of Object.entries(interpolated)) {
		if (typeof value === "string") {
			interpolated[key] = interpolatePlaceholders(value, placeholders);
		}
	}

	interpolated.customSections = interpolateCustomSections(
		config.customSections,
		placeholders
	);

	return interpolated as unknown as ReadieConfig;
};

const resolveMergedValue = <T>(
	key: keyof ReadieConfig,
	projectConfig: ReadieConfig,
	globalConfig: ReadieGlobalConfig | null
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

const readGlobalCustomSections = (global: Record<string, unknown>) => {
	if (typeof global.customSections !== "object" || !global.customSections) {
		return;
	}
	return global.customSections as Record<string, string>;
};

const readProjectCustomSections = (project: Record<string, unknown>) => {
	const projectCustomSections = project.customSections;
	if (projectCustomSections === null) {
		return null;
	}
	if (typeof projectCustomSections !== "object" || !projectCustomSections) {
		return;
	}
	return projectCustomSections as Record<string, string>;
};

const resolveMergedCustomSections = (
	globalConfig: ReadieGlobalConfig | null,
	projectConfig: ReadieConfig
) => {
	const project = projectConfig as unknown as Record<string, unknown>;
	const global = (globalConfig ?? {}) as Record<string, unknown>;
	const globalCustomSections = readGlobalCustomSections(global);

	if (!hasOwn(project, "customSections")) {
		return globalCustomSections;
	}

	const projectCustomSections = readProjectCustomSections(project);
	if (projectCustomSections === null || projectCustomSections === undefined) {
		return;
	}

	return {
		...globalCustomSections,
		...projectCustomSections,
	};
};

export const mergeConfigs = (
	globalConfig: ReadieGlobalConfig | null,
	projectConfig: ReadieConfig,
	interpolationContext: InterpolationContext = {}
): ReadieConfig => {
	const mergedCustomSections = resolveMergedCustomSections(
		globalConfig,
		projectConfig
	);

	const merged: ReadieConfig = {
		$schema: resolveMergedValue("$schema", projectConfig, globalConfig),
		badges: resolveMergedValue("badges", projectConfig, globalConfig),
		banner: resolveMergedValue("banner", projectConfig, globalConfig),
		commands: resolveMergedValue("commands", projectConfig, globalConfig),
		contributing: resolveMergedValue(
			"contributing",
			projectConfig,
			globalConfig
		),
		customSections: mergedCustomSections,
		description: projectConfig.description,
		docsLink: resolveMergedValue("docsLink", projectConfig, globalConfig),
		features: resolveMergedValue("features", projectConfig, globalConfig),
		footer: resolveMergedValue("footer", projectConfig, globalConfig),
		globalFlags: resolveMergedValue("globalFlags", projectConfig, globalConfig),
		includeTableOfContents: resolveMergedValue(
			"includeTableOfContents",
			projectConfig,
			globalConfig
		),
		installation: resolveMergedValue(
			"installation",
			projectConfig,
			globalConfig
		),
		license: resolveMergedValue("license", projectConfig, globalConfig),
		manualInstallation: resolveMergedValue(
			"manualInstallation",
			projectConfig,
			globalConfig
		),
		output: resolveMergedValue("output", projectConfig, globalConfig),
		prerequisites: resolveMergedValue(
			"prerequisites",
			projectConfig,
			globalConfig
		),
		quickStart: resolveMergedValue("quickStart", projectConfig, globalConfig),
		quickStartLink: resolveMergedValue(
			"quickStartLink",
			projectConfig,
			globalConfig
		),
		security: resolveMergedValue("security", projectConfig, globalConfig),
		support: resolveMergedValue("support", projectConfig, globalConfig),
		title: projectConfig.title,
		usage: resolveMergedValue("usage", projectConfig, globalConfig),
		version: resolveMergedValue("version", projectConfig, globalConfig),
	};

	return interpolateTopLevelStrings(merged, interpolationContext);
};
