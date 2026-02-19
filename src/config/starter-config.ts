import type { ReadieConfig } from "./types";

/**
 * Default schema URL written to starter configs.
 */
export const DEFAULT_SCHEMA_URL =
	"https://unpkg.com/readie/schemas/readie.schema.json";

/**
 * Baseline `readie.json` content used by the `init` command.
 */
export const starterConfig: ReadieConfig = {
	$schema: DEFAULT_SCHEMA_URL,
	description: "A short description of what this project does.",
	docsLink: "https://example.com/docs",
	features: ["Fast setup", "Clear docs", "Simple CLI usage"],
	includeTableOfContents: true,
	installation: ["```bash\nnpm install my-project\n```"],
	title: "My Project",
	usage: ["Explain basic usage in a few steps.", "```bash\nnpm run start\n```"],
	version: "1",
};

/**
 * Stringified starter config with a trailing newline for file output.
 */
export const starterConfigText = `${JSON.stringify(starterConfig, null, 2)}\n`;
