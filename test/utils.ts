import { ensureDir, writeFile } from "fs-extra";
import { dirname } from "pathe";

export const writeJson = async (filePath: string, value: unknown) => {
	await ensureDir(dirname(filePath));
	await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
};
