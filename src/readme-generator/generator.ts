import * as fssync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import {
  loadGlobalConfig,
  loadReadieConfig,
  mergeConfigs,
} from "../config/load-config.js";
import type {
  GenerateSingleOptions,
  GenerateSingleResult,
  GenerateWorkspaceOptions,
  GenerateWorkspaceResult,
} from "../config/types.js";
import { baseReadmeTemplate } from "./template.js";

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
    return path.resolve(cliOutputPath);
  }
  if (configOutputPath) {
    return path.resolve(path.dirname(configPath), configOutputPath);
  }
  return path.resolve(path.dirname(configPath), "README.md");
};

const resolvePackageName = async (
  configPath: string
): Promise<string | undefined> => {
  const packageJsonPath = path.join(path.dirname(configPath), "package.json");

  try {
    const rawPackageJson = await fs.readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(rawPackageJson) as { name?: unknown };
    return typeof parsed.name === "string" && parsed.name.trim().length > 0
      ? parsed.name
      : undefined;
  } catch (error) {
    console.warn(`Package.json not found at ${packageJsonPath}:`, error);
    return undefined;
  }
};

export const generateReadmeFromConfig = async ({
  configPath,
  outputPath,
  dryRun,
  useGlobalConfig = true,
}: GenerateSingleOptions): Promise<GenerateSingleResult> => {
  const absoluteConfigPath = path.resolve(configPath);
  const projectConfig = await loadReadieConfig(absoluteConfigPath);
  const globalConfig = useGlobalConfig
    ? await loadGlobalConfig(path.dirname(absoluteConfigPath))
    : null;
  const packageName = await resolvePackageName(absoluteConfigPath);
  const config = mergeConfigs(globalConfig, projectConfig, { packageName });
  const resolvedOutputPath = resolveOutputPath(
    absoluteConfigPath,
    config.output,
    outputPath
  );

  const content = baseReadmeTemplate(config);
  const existingContent = fssync.existsSync(resolvedOutputPath)
    ? await fs.readFile(resolvedOutputPath, "utf8")
    : null;

  if (existingContent === content) {
    return {
      outputPath: resolvedOutputPath,
      updated: false,
    };
  }

  if (!dryRun) {
    await fs.writeFile(resolvedOutputPath, content, "utf8");
  }

  return {
    outputPath: resolvedOutputPath,
    updated: true,
  };
};

export async function generateWorkspaceReadmes({
  rootDir,
  configName,
  packageFilter,
  dryRun,
  useGlobalConfig = true,
}: GenerateWorkspaceOptions): Promise<GenerateWorkspaceResult> {
  const absoluteRootDir = path.resolve(rootDir);
  if (!fssync.existsSync(absoluteRootDir)) {
    throw new Error(`Workspace root not found at ${absoluteRootDir}`);
  }

  const entries = await fs.readdir(absoluteRootDir, { withFileTypes: true });
  const allProjectDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(absoluteRootDir, entry.name))
    .filter((dir) => fssync.existsSync(path.join(dir, configName)));

  const selectedProjectDirs =
    packageFilter.size > 0
      ? allProjectDirs.filter((dir) => packageFilter.has(path.basename(dir)))
      : allProjectDirs;

  const skippedByFilter =
    packageFilter.size > 0
      ? allProjectDirs
          .map((dir) => path.basename(dir))
          .filter((dirName) => !packageFilter.has(dirName))
      : [];

  const result: GenerateWorkspaceResult = {
    failed: [],
    skippedByFilter,
    unchanged: [],
    updated: [],
  };

  for (const projectDir of selectedProjectDirs) {
    const projectName = path.basename(projectDir);
    const configPath = path.join(projectDir, configName);
    try {
      const singleResult = await generateReadmeFromConfig({
        configPath,
        dryRun,
        useGlobalConfig,
      });
      if (singleResult.updated) {
        result.updated.push(projectName);
        console.log(
          `${dryRun ? "Would update" : "Generated"} README for ${projectName}`
        );
      } else {
        result.unchanged.push(projectName);
        console.log(`No changes for ${projectName}`);
      }
    } catch (error) {
      result.failed.push({ error, projectDir: projectName });
      console.error(`Error generating README for ${projectName}:`, error);
    }
  }

  return result;
}
