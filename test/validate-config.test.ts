import { writeFile } from "fs-extra";
import { join } from "pathe";
import { temporaryDirectory } from "tempy";

import { loadReadieConfig } from "#src/config/load-config.js";

const createTempFile = async (contents: string) => {
	const dir = temporaryDirectory();
	const filePath = join(dir, "readie.json");
	await writeFile(filePath, contents, "utf8");
	return filePath;
};

describe("load readie config", () => {
	it("loads a valid config", async () => {
		const configPath = await createTempFile(
			JSON.stringify({
				description: "Config validation test.",
				title: "Test Project",
			})
		);

		const config = await loadReadieConfig(configPath);
		expect(config.title).toBe("Test Project");
	});

	it("throws for invalid config", async () => {
		const configPath = await createTempFile(
			JSON.stringify({
				description: "Missing title should fail.",
			})
		);

		await expect(loadReadieConfig(configPath)).rejects.toThrow(
			"Configuration validation failed"
		);
	});
});
