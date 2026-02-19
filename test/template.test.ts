import type { ReadieConfig } from "#src/config/types.js";
import { baseReadmeTemplate } from "#src/readme-generator/template.js";

const createConfig = (overrides: Partial<ReadieConfig> = {}): ReadieConfig => ({
	description: "A neutral README.",
	title: "Readie Demo",
	...overrides,
});

describe("base readme template", () => {
	it("renders neutral markdown without c15t defaults", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				features: ["Fast", "Simple"],
				includeTableOfContents: true,
				installation: ["```bash\nnpm install readie-demo\n```"],
				security: "Please report issues privately.",
				usage: ["Run the command", "```bash\nnpx readie\n```"],
			})
		);

		const requiredHeadings = [
			"# Readie Demo",
			"## Table of Contents",
			"## Key Features",
			"## Security",
		];
		const missingHeadings = requiredHeadings.filter(
			(heading) => !markdown.includes(heading)
		);
		expect(missingHeadings).toStrictEqual([]);
		expect(markdown).not.toMatch(/c15t|consent\.io/);
	});

	it("omits table of contents when includeTableOfContents is false", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				features: ["Fast"],
				includeTableOfContents: false,
			})
		);

		expect(markdown).not.toContain("## Table of Contents");
	});

	it("creates unique toc links for repeated section titles", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				customSections: {
					"Quick Start": "Project-specific quick start details.",
				},
				includeTableOfContents: true,
				quickStart: "Install and run.",
			})
		);

		expect(markdown).toContain("- [Quick Start](#quick-start)");
		expect(markdown).toContain("- [Quick Start](#quick-start-1)");
	});

	it("suppresses top-level title when banner already contains an h1", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				banner: "<h1>Readie Banner</h1>",
			})
		);

		expect(markdown).toContain("<h1>Readie Banner</h1>");
		expect(markdown).not.toContain("# Readie Demo");
	});

	it("keeps top-level title when banner does not contain an h1", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				banner: "<div>Readie Banner</div>",
			})
		);

		expect(markdown).toContain("<div>Readie Banner</div>");
		expect(markdown).toContain("# Readie Demo");
	});

	it("renders usage as numbered steps while preserving fenced code blocks", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				usage: [
					"Install dependencies",
					"```bash\nbun install\n```",
					"- Run checks",
					"```bash\nbun run test\n```",
				],
			})
		);

		expect(markdown).toContain("1. Install dependencies");
		expect(markdown).toContain("2. Run checks");
		expect(markdown).toContain("```bash\nbun install\n```");
		expect(markdown).toContain("```bash\nbun run test\n```");
	});

	it("renders string license section", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				license: "MIT",
			})
		);

		expect(markdown).toContain("## License\n\nMIT");
	});

	it("renders object license section", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				license: { name: "MIT", url: "https://opensource.org/license/mit" },
			})
		);

		expect(markdown).toContain(
			"## License\n\n[MIT](https://opensource.org/license/mit)"
		);
	});

	it("renders linked and unlinked badges", () => {
		const markdown = baseReadmeTemplate(
			createConfig({
				badges: [
					{
						image: "https://img.shields.io/npm/v/readie",
						label: "Version",
					},
					{
						image: "https://img.shields.io/npm/l/readie",
						label: "License",
						link: "https://opensource.org/license/mit",
					},
				],
			})
		);

		expect(markdown).toContain(
			"![Version](https://img.shields.io/npm/v/readie)"
		);
		expect(markdown).toContain(
			"[![License](https://img.shields.io/npm/l/readie)](https://opensource.org/license/mit)"
		);
	});
});
