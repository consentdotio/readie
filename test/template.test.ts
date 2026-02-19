import { baseReadmeTemplate } from "#src/readme-generator/template.js";

describe("base readme template", () => {
	it("renders neutral markdown without c15t defaults", () => {
		const markdown = baseReadmeTemplate({
			description: "A neutral README.",
			features: ["Fast", "Simple"],
			includeTableOfContents: true,
			installation: ["```bash\nnpm install readie-demo\n```"],
			security: "Please report issues privately.",
			title: "Readie Demo",
			usage: ["Run the command", "```bash\nnpx readie\n```"],
		});

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
});
