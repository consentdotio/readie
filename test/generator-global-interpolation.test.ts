import { ensureDir, readFile, remove, writeFile } from "fs-extra";
import { join } from "pathe";
import { temporaryDirectory } from "tempy";

import { generateReadmeFromConfig } from "#src/readme-generator/generator.js";

const writeJson = async (filePath: string, value: unknown) => {
	await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
};

const setupFixture = async () => {
	const rootDir = temporaryDirectory();
	const packageDir = join(rootDir, "packages", "react");
	await ensureDir(packageDir);

	await writeJson(join(rootDir, "readie.global.json"), {
		banner: '<h1 align="center">{{title}}</h1>',
		footer: "Built for {{ title }} ({{packageNameEncoded}})",
	});

	await writeJson(join(packageDir, "package.json"), {
		name: "@c15t/react",
		version: "1.0.0",
	});

	const configPath = join(packageDir, "readie.json");
	await writeJson(configPath, {
		description: "CMP for React",
		title: "@c15t/react: React Consent Components",
	});

	return { configPath, rootDir };
};

describe("generateReadmeFromConfig with global interpolation", () => {
	it("injects title and package placeholders in global config", async () => {
		const { configPath, rootDir } = await setupFixture();
		const result = await generateReadmeFromConfig({
			configPath,
			dryRun: false,
		});
		const generated = await readFile(result.outputPath, "utf8");

		expect(generated).toContain(
			'<h1 align="center">@c15t/react: React Consent Components</h1>'
		);
		expect(generated).toContain(
			"Built for @c15t/react: React Consent Components (%40c15t%2Freact)"
		);
		await remove(rootDir);
	});
});
