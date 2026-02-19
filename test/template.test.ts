import { baseReadmeTemplate } from "../src/readme-generator/template";

describe(baseReadmeTemplate, () => {
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

    expect(markdown).toContain("# Readie Demo");
    expect(markdown).toContain("## Table of Contents");
    expect(markdown).toContain("## Key Features");
    expect(markdown).toContain("## Security");
    expect(markdown).not.toContain("c15t");
    expect(markdown).not.toContain("consent.io");
  });
});
