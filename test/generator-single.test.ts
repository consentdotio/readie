import { pathExists, readFile, remove } from "fs-extra";
import { join, resolve } from "pathe";
import { temporaryDirectory } from "tempy";

import { generateReadmeFromConfig } from "#src/readme-generator/generator.js";

import { writeJson } from "./utils.js";

const setupProject = async (configOverrides: Record<string, unknown> = {}) => {
	const projectDir = temporaryDirectory();
	const configPath = join(projectDir, "readie.json");
	await writeJson(configPath, {
		description: "Generated from tests.",
		title: "Generator Test",
		...configOverrides,
	});
	return { configPath, projectDir };
};

const withProject = async (
	run: (fixture: { configPath: string; projectDir: string }) => Promise<void>,
	configOverrides?: Record<string, unknown>
) => {
	const fixture = await setupProject(configOverrides);
	try {
		await run(fixture);
	} finally {
		await remove(fixture.projectDir);
	}
};

const withTwoProjects = async (
	run: (
		first: { configPath: string; projectDir: string },
		second: { configPath: string; projectDir: string }
	) => Promise<void>
) => {
	const first = await setupProject({ output: "README.config.md" });
	const second = await setupProject();
	try {
		await run(first, second);
	} finally {
		await remove(first.projectDir);
		await remove(second.projectDir);
	}
};

const createGlobalConfigFixture = async () => {
	const rootDir = temporaryDirectory();
	const packageDir = join(rootDir, "packages", "api");
	const configPath = join(packageDir, "readie.json");
	await writeJson(join(rootDir, "readie.global.json"), {
		banner: "GLOBAL_BANNER_SHOULD_NOT_APPEAR",
	});
	await writeJson(configPath, {
		description: "Package docs.",
		title: "Package API",
	});
	return { configPath, rootDir };
};

describe("generator single behavior", () => {
	it("returns updated false when output content is unchanged", async () => {
		await withProject(async (fixture) => {
			const firstResult = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: false,
			});
			const secondResult = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: false,
			});
			await writeJson(fixture.configPath, {
				description: "Generated from tests.",
				title: "Generator Test Updated",
			});
			const thirdResult = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: false,
			});

			expect(firstResult.updated).toBeTruthy();
			expect(secondResult.updated).toBeFalsy();
			expect(thirdResult.updated).toBeTruthy();
		});
	});

	it("reports an update on dry run without writing output file", async () => {
		await withProject(async (fixture) => {
			const outputPath = join(fixture.projectDir, "README.dry-run.md");
			const result = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: true,
				outputPath,
			});

			expect(result.updated).toBeTruthy();
			expect(result.outputPath).toBe(resolve(outputPath));
			await expect(pathExists(outputPath)).resolves.toBeFalsy();
		});
	});

	it("uses output precedence of cli output > config output > default", async () => {
		await withTwoProjects(async (fixture, defaultFixture) => {
			const cliOutput = join(fixture.projectDir, "README.cli.md");
			const cliResult = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: true,
				outputPath: cliOutput,
			});
			const configResult = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: true,
			});
			const defaultResult = await generateReadmeFromConfig({
				configPath: defaultFixture.configPath,
				dryRun: true,
			});

			expect(cliResult.outputPath).toBe(resolve(cliOutput));
			expect(configResult.outputPath).toBe(
				resolve(fixture.projectDir, "README.config.md")
			);
			expect(defaultResult.outputPath).toBe(
				resolve(defaultFixture.projectDir, "README.md")
			);
		});
	});

	it("ignores readie.global.json when useGlobalConfig is false", async () => {
		const fixture = await createGlobalConfigFixture();
		try {
			const result = await generateReadmeFromConfig({
				configPath: fixture.configPath,
				dryRun: false,
				useGlobalConfig: false,
			});
			const content = await readFile(result.outputPath, "utf8");

			expect(content).not.toContain("GLOBAL_BANNER_SHOULD_NOT_APPEAR");
			expect(content).toContain("# Package API");
		} finally {
			await remove(fixture.rootDir);
		}
	});
});
