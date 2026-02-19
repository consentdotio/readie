import {
	existsSync,
	pathExists,
	readdir,
	readFile,
	readJson,
	writeFile,
} from "fs-extra";
import { basename, dirname, join, resolve } from "pathe";

import {
	loadGlobalConfig,
	loadReadieConfig,
	mergeConfigs,
} from "#src/config/load-config";
import type {
	GenerateSingleOptions,
	GenerateSingleResult,
	GenerateWorkspaceOptions,
	GenerateWorkspaceResult,
} from "#src/config/types";

import { baseReadmeTemplate } from "./template";

export const parsePackageList = (values: string[]): Set<string> => {
	const packages = new Set<string>();
	for (const value of values) {
		for (const part of value.split(",")) {
			const name = part.trim();
			if (name.length > 0) {
				packages.add(name);
			}
		}
	}
	return packages;
};

const resolveOutputPath = (
	configPath: string,
	configOutputPath: string | undefined,
	cliOutputPath: string | undefined
) => {
	if (cliOutputPath) {
		return resolve(cliOutputPath);
	}
	if (configOutputPath) {
		return resolve(dirname(configPath), configOutputPath);
	}
	return resolve(dirname(configPath), "README.md");
};

const resolvePackageName = async (
	configPath: string
): Promise<string | undefined> => {
	const packageJsonPath = join(dirname(configPath), "package.json");

	try {
		const parsed = (await readJson(packageJsonPath)) as { name?: unknown };
		return typeof parsed.name === "string" && parsed.name.trim().length > 0
			? parsed.name
			: undefined;
	} catch {
		return undefined;
	}
};

const loadMergedConfig = async (
	absoluteConfigPath: string,
	useGlobalConfig: boolean
) => {
	const projectConfig = await loadReadieConfig(absoluteConfigPath);
	const globalConfig = useGlobalConfig
		? await loadGlobalConfig(dirname(absoluteConfigPath))
		: null;
	const packageName = await resolvePackageName(absoluteConfigPath);
	return mergeConfigs(globalConfig, projectConfig, { packageName });
};

const readExistingContent = async (filePath: string) => {
	if (!(await pathExists(filePath))) {
		return null;
	}
	return readFile(filePath, "utf8");
};

export const generateReadmeFromConfig = async ({
	configPath,
	outputPath,
	dryRun,
	useGlobalConfig = true,
}: GenerateSingleOptions): Promise<GenerateSingleResult> => {
	const absoluteConfigPath = resolve(configPath);
	const config = await loadMergedConfig(absoluteConfigPath, useGlobalConfig);
	const resolvedOutputPath = resolveOutputPath(
		absoluteConfigPath,
		config.output,
		outputPath
	);

	const content = baseReadmeTemplate(config);
	const existingContent = await readExistingContent(resolvedOutputPath);

	if (existingContent === content) {
		return {
			outputPath: resolvedOutputPath,
			updated: false,
		};
	}

	if (!dryRun) {
		await writeFile(resolvedOutputPath, content, "utf8");
	}

	return {
		outputPath: resolvedOutputPath,
		updated: true,
	};
};

const listProjectDirsWithConfig = async (
	rootDir: string,
	configName: string
) => {
	const entries = await readdir(rootDir, { withFileTypes: true });
	const allProjectDirs = entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(rootDir, entry.name));

	const projectChecks = await Promise.all(
		allProjectDirs.map(async (dir) => ({
			dir,
			hasConfig: await pathExists(join(dir, configName)),
		}))
	);

	return projectChecks.filter((item) => item.hasConfig).map((item) => item.dir);
};

const selectProjectDirs = (
	allProjectDirs: string[],
	packageFilter: Set<string>
) =>
	packageFilter.size > 0
		? allProjectDirs.filter((dir) => packageFilter.has(basename(dir)))
		: allProjectDirs;

const collectSkippedByFilter = (
	allProjectDirs: string[],
	packageFilter: Set<string>
) => {
	if (packageFilter.size === 0) {
		return [];
	}
	return allProjectDirs
		.map((dir) => basename(dir))
		.filter((dirName) => !packageFilter.has(dirName));
};

const pushProjectResult = (
	result: GenerateWorkspaceResult,
	projectName: string,
	updated: boolean,
	dryRun: boolean
) => {
	if (updated) {
		result.updated.push(projectName);
		const action = dryRun ? "Would update" : "Generated";
		console.log(`${action} README for ${projectName}`);
		return;
	}

	result.unchanged.push(projectName);
	console.log(`No changes for ${projectName}`);
};

const processWorkspaceProject = async (
	projectDir: string,
	configName: string,
	dryRun: boolean,
	useGlobalConfig: boolean,
	result: GenerateWorkspaceResult
) => {
	const projectName = basename(projectDir);
	const configPath = join(projectDir, configName);
	try {
		const singleResult = await generateReadmeFromConfig({
			configPath,
			dryRun,
			useGlobalConfig,
		});
		pushProjectResult(result, projectName, singleResult.updated, dryRun);
	} catch (error) {
		result.failed.push({ error, projectDir: projectName });
		console.error(`Error generating README for ${projectName}:`, error);
	}
};

export const generateWorkspaceReadmes = async ({
	rootDir,
	configName,
	packageFilter,
	dryRun,
	useGlobalConfig = true,
}: GenerateWorkspaceOptions): Promise<GenerateWorkspaceResult> => {
	const absoluteRootDir = resolve(rootDir);
	if (!existsSync(absoluteRootDir)) {
		throw new Error(`Workspace root not found at ${absoluteRootDir}`);
	}

	const allProjectDirs = await listProjectDirsWithConfig(
		absoluteRootDir,
		configName
	);
	const selectedProjectDirs = selectProjectDirs(allProjectDirs, packageFilter);
	const skippedByFilter = collectSkippedByFilter(allProjectDirs, packageFilter);

	const result: GenerateWorkspaceResult = {
		failed: [],
		skippedByFilter,
		unchanged: [],
		updated: [],
	};

	for (const projectDir of selectedProjectDirs) {
		await processWorkspaceProject(
			projectDir,
			configName,
			dryRun,
			useGlobalConfig,
			result
		);
	}

	return result;
};
