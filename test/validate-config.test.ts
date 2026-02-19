import { remove, writeFile } from "fs-extra";
import { join } from "pathe";
import { temporaryDirectory } from "tempy";

import { loadReadieConfig } from "#src/config/load-config.js";

const createTempFile = async (contents: string) => {
	const dir = temporaryDirectory();
	const filePath = join(dir, "readie.json");
	await writeFile(filePath, contents, "utf8");
	return { dir, filePath };
};

describe("load readie config", () => {
	it("loads a valid config", async () => {
		const { dir, filePath } = await createTempFile(
			JSON.stringify({
				description: "Config validation test.",
				title: "Test Project",
			})
		);
		try {
			const config = await loadReadieConfig(filePath);
			expect(config.title).toBe("Test Project");
		} finally {
			await remove(dir);
		}
	});

	it("throws for invalid config", async () => {
		const { dir, filePath } = await createTempFile(
			JSON.stringify({
				description: "Missing title should fail.",
			})
		);
		try {
			await expect(loadReadieConfig(filePath)).rejects.toThrow(
				"Configuration validation failed"
			);
		} finally {
			await remove(dir);
		}
	});
});
