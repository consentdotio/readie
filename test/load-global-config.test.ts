import { ensureDir, remove, writeFile } from "fs-extra";
import { join } from "pathe";
import { temporaryDirectory } from "tempy";

import { loadGlobalConfig, loadReadieConfig } from "#src/config/load-config.js";

import { writeJson } from "./utils.js";

describe("config loading edge cases", () => {
	it("includes file path when JSON parsing fails", async () => {
		const rootDir = temporaryDirectory();
		const filePath = join(rootDir, "readie.json");
		await writeFile(filePath, "{ invalid json", "utf8");

		try {
			await expect(loadReadieConfig(filePath)).rejects.toThrow(
				`Failed to parse JSON in ${filePath}`
			);
		} finally {
			await remove(rootDir);
		}
	});

	it("loads nearest readie.global.json while traversing parent directories", async () => {
		const rootDir = temporaryDirectory();
		const packagesDir = join(rootDir, "packages");
		const deepDir = join(packagesDir, "react", "src");

		await writeJson(join(rootDir, "readie.global.json"), {
			footer: "ROOT GLOBAL",
		});
		await writeJson(join(packagesDir, "readie.global.json"), {
			footer: "PACKAGES GLOBAL",
		});
		await ensureDir(deepDir);

		try {
			const globalConfig = await loadGlobalConfig(deepDir);
			expect(globalConfig?.footer).toBe("PACKAGES GLOBAL");
		} finally {
			await remove(rootDir);
		}
	});

	it("returns null when no global config is found", async () => {
		const rootDir = temporaryDirectory();
		const deepDir = join(rootDir, "one", "two");
		await ensureDir(deepDir);

		try {
			await expect(loadGlobalConfig(deepDir)).resolves.toBeNull();
		} finally {
			await remove(rootDir);
		}
	});

	it("throws for invalid global config schema", async () => {
		const rootDir = temporaryDirectory();
		const deepDir = join(rootDir, "app");
		await ensureDir(deepDir);
		await writeJson(join(rootDir, "readie.global.json"), {
			title: 123,
		});

		try {
			await expect(loadGlobalConfig(deepDir)).rejects.toThrow(
				`Global configuration validation failed for ${join(rootDir, "readie.global.json")}`
			);
		} finally {
			await remove(rootDir);
		}
	});
});
