import { mergeConfigs } from "#src/config/load-config.js";
import type { ReadieConfig, ReadieGlobalConfig } from "#src/config/types.js";

const createProjectConfig = (
  overrides: Partial<ReadieConfig> = {}
): ReadieConfig => ({
  description: "Project level description.",
  title: "My Package",
  ...overrides,
});

describe("merge configs", () => {
  it("interpolates top-level global string placeholders", () => {
    const globalConfig: ReadieGlobalConfig = {
      banner: '<h1 align="center">{{title}}</h1>',
      customSections: {
        Notes: "Package: {{title}}",
      },
      features: ["Feature A"],
      footer: "Built by {{ title }} - {{packageName}} - {{packageNameEncoded}}",
    };

    const merged = mergeConfigs(globalConfig, createProjectConfig(), {
      packageName: "@c15t/react",
    });

    expect(merged.banner).toBe('<h1 align="center">My Package</h1>');
    expect(merged.footer).toBe(
      "Built by My Package - @c15t/react - %40c15t%2Freact"
    );
    expect(merged.features).toStrictEqual(["Feature A"]);
    expect(merged.customSections?.Notes).toBe("Package: My Package");
  });

  it("preserves project-over-global precedence before interpolation", () => {
    const globalConfig: ReadieGlobalConfig = {
      banner: "Global banner {{title}}",
      quickStart: "Global quick start",
    };

    const projectConfig = createProjectConfig({
      banner: "Project banner",
      quickStart: "Project quick start for {{title}}",
    });

    const merged = mergeConfigs(globalConfig, projectConfig);

    expect(merged.banner).toBe("Project banner");
    expect(merged.quickStart).toBe("Project quick start for My Package");
  });

  it("falls back to title when packageName is unavailable", () => {
    const globalConfig: ReadieGlobalConfig = {
      footer: "Encoded: {{packageNameEncoded}}",
    };

    const merged = mergeConfigs(globalConfig, createProjectConfig());
    expect(merged.footer).toBe("Encoded: My%20Package");
  });
});
