import { ensureDir, remove, writeFile } from "fs-extra";
import { dirname, join } from "pathe";
import { temporaryDirectory } from "tempy";

import {
	generateReadmeFromConfig,
	generateWorkspaceReadmes,
} from "#src/readme-generator/generator.js";

const writeJson = async (filePath: string, value: unknown) => {
	await ensureDir(dirname(filePath));
	await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
};

const withSilencedConsole = async (run: () => Promise<void>) => {
	const logSpy = vi.spyOn(console, "log").mockReturnValue();
	const errorSpy = vi.spyOn(console, "error").mockReturnValue();
	try {
		await run();
	} finally {
		logSpy.mockRestore();
		errorSpy.mockRestore();
	}
};

const setupWorkspacePackages = async (
	rootDir: string,
	entries: { name: string; config: Record<string, unknown> }[]
) => {
	for (const entry of entries) {
		await writeJson(join(rootDir, entry.name, "readie.json"), entry.config);
	}
};

describe("generator workspace behavior", () => {
	it("throws when workspace root does not exist", async () => {
		const missingRoot = join(temporaryDirectory(), "missing-root");

		await expect(
			generateWorkspaceReadmes({
				configName: "readie.json",
				dryRun: false,
				packageFilter: new Set<string>(),
				rootDir: missingRoot,
			})
		).rejects.toThrow("Workspace root not found");
	});

	it("applies package filters and tracks updated, unchanged, and skipped", async () => {
		const rootDir = temporaryDirectory();
		const betaConfigPath = join(rootDir, "beta", "readie.json");
		await setupWorkspacePackages(rootDir, [
			{ config: { description: "Alpha docs", title: "Alpha" }, name: "alpha" },
			{ config: { description: "Beta docs", title: "Beta" }, name: "beta" },
			{ config: { description: "Gamma docs", title: "Gamma" }, name: "gamma" },
		]);

		try {
			await withSilencedConsole(async () => {
				await generateReadmeFromConfig({
					configPath: betaConfigPath,
					dryRun: false,
					useGlobalConfig: false,
				});
				const result = await generateWorkspaceReadmes({
					configName: "readie.json",
					dryRun: false,
					packageFilter: new Set(["alpha", "beta"]),
					rootDir,
					useGlobalConfig: false,
				});
				expect(result.updated).toStrictEqual(expect.arrayContaining(["alpha"]));
				expect(result.unchanged).toStrictEqual(
					expect.arrayContaining(["beta"])
				);
				expect(result.skippedByFilter).toStrictEqual(["gamma"]);
				expect(result.failed).toHaveLength(0);
			});
		} finally {
			await remove(rootDir);
		}
	});

	it("continues processing when one workspace project fails", async () => {
		const rootDir = temporaryDirectory();

		await setupWorkspacePackages(rootDir, [
			{ config: { description: "Good docs", title: "Good" }, name: "good" },
			{ config: { description: "Missing title fails schema" }, name: "bad" },
		]);

		try {
			await withSilencedConsole(async () => {
				const result = await generateWorkspaceReadmes({
					configName: "readie.json",
					dryRun: false,
					packageFilter: new Set<string>(),
					rootDir,
					useGlobalConfig: false,
				});
				expect(result.updated).toStrictEqual(expect.arrayContaining(["good"]));
				expect(result.failed).toHaveLength(1);
				expect(result.failed[0]?.projectDir).toContain("/bad");
				expect(result.unchanged).toHaveLength(0);
			});
		} finally {
			await remove(rootDir);
		}
	});
});
