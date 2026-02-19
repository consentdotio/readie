import type {
  ReadieBadge,
  ReadieConfig,
  ReadieLicenseObject,
} from "../config/types.js";

const isNonEmpty = (value?: string | null): value is string =>
  typeof value === "string" && value.trim().length > 0;

const renderNumberedWithCodeBlocks = (items: string[]) => {
  const lines: string[] = [];
  let i = 1;

  for (const rawItem of items) {
    const item = rawItem.trim();
    if (!item) {
      continue;
    }

    if (item.startsWith("```")) {
      if (lines.length > 0 && lines.at(-1) !== "") {
        lines.push("");
      }
      lines.push(item);
      lines.push("");
      continue;
    }

    if (item.startsWith("- ")) {
      lines.push(`${i}. ${item.slice(2)}`);
      i += 1;
      continue;
    }

    lines.push(`${i}. ${item}`);
    i += 1;
  }

  return lines
    .join("\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
};

const addSection = (
  header: string,
  content: string[] | undefined,
  formatter: (item: string, index?: number) => string = (item) => `- ${item}`
) => {
  if (!content || content.length === 0) {
    return "";
  }
  const body = content.map(formatter).join("\n");
  return `${header}\n\n${body}`.trim();
};

export const baseReadmeTemplate = (rawConfig: ReadieConfig) => {
  const config: ReadieConfig = { ...rawConfig };

  const bannerBlock = isNonEmpty(config.banner) ? config.banner : "";
  const titleBlock =
    isNonEmpty(bannerBlock) && bannerBlock.toLowerCase().includes("<h1")
      ? ""
      : `# ${config.title}`;

  const badgesBlock =
    config.badges && config.badges.length > 0
      ? config.badges
          .map((badge: ReadieBadge) => {
            const image = `![${badge.label}](${badge.image})`;
            return isNonEmpty(badge.link) ? `[${image}](${badge.link})` : image;
          })
          .join("\n")
      : "";

  const featuresBlock =
    config.features && config.features.length > 0
      ? `## Key Features\n\n${config.features.map((feature) => `- ${feature}`).join("\n")}`
      : "";

  const prerequisitesBlock = addSection(
    "## Prerequisites",
    config.prerequisites
  );

  const quickStartBlock = isNonEmpty(config.quickStart)
    ? (config.quickStart.trimStart().startsWith("## ")
      ? config.quickStart
      : `## Quick Start\n\n${config.quickStart}`)
    : "";

  const manualInstallationBlock =
    config.manualInstallation && config.manualInstallation.length > 0
      ? `## Manual Installation\n\n${config.manualInstallation.join("\n")}`
      : "";

  const installationBlock =
    config.installation && config.installation.length > 0
      ? `## Installation\n\n${config.installation.join("\n")}`
      : "";

  const usageBlock =
    config.usage && config.usage.length > 0
      ? `## Usage\n\n${renderNumberedWithCodeBlocks(config.usage)}`
      : "";

  const commandsBlock =
    config.commands && config.commands.length > 0
      ? `## Available Commands\n\n${config.commands.map((cmd) => `- \`${cmd.name}\`: ${cmd.description}`).join("\n")}`
      : "";

  const globalFlagsBlock =
    config.globalFlags && config.globalFlags.length > 0
      ? `## Global Flags\n\n${config.globalFlags.map((flag) => `- \`${flag.flag}\`: ${flag.description}`).join("\n")}`
      : "";

  const docsBlock = config.docsLink
    ? `## Documentation

For further information, guides, and examples visit the [reference documentation](${config.docsLink}).`
    : "";

  const quickStartLinkBlock = config.quickStartLink
    ? `## Additional Quick Start

See the full quick start guide [here](${config.quickStartLink}).`
    : "";

  const customSectionsBlock = config.customSections
    ? Object.entries(config.customSections)
        .map(([heading, content]) => `## ${heading}\n\n${content}`)
        .join("\n\n")
    : "";

  const supportBlock = addSection("## Support", config.support);
  const contributingBlock = addSection("## Contributing", config.contributing);
  const securityBlock = isNonEmpty(config.security)
    ? (isNonEmpty(config.security) &&
      config.security.trimStart().startsWith("## ")
      ? config.security
      : `## Security\n\n${config.security}`)
    : "";

  const licenseBlock = (() => {
    if (!config.license) {
      return "";
    }
    if (typeof config.license === "string") {
      return config.license.trimStart().startsWith("## ")
        ? config.license
        : `## License\n\n${config.license}`;
    }
    const { name, url } = config.license as ReadieLicenseObject;
    return `## License\n\n[${name}](${url})`;
  })();

  const footerBlock = isNonEmpty(config.footer) ? config.footer : "";

  const tocSectionTitles = [
    ["Key Features", featuresBlock],
    ["Prerequisites", prerequisitesBlock],
    ["Quick Start", quickStartBlock],
    ["Installation", installationBlock],
    ["Manual Installation", manualInstallationBlock],
    ["Usage", usageBlock],
    ["Available Commands", commandsBlock],
    ["Global Flags", globalFlagsBlock],
    ["Documentation", docsBlock],
    ["Additional Quick Start", quickStartLinkBlock],
    ["Support", supportBlock],
    ["Contributing", contributingBlock],
    ["Security", securityBlock],
    ["License", licenseBlock],
  ].filter(([, section]) => isNonEmpty(section));

  if (isNonEmpty(customSectionsBlock)) {
    for (const key of Object.keys(config.customSections ?? {})) {
      tocSectionTitles.push([key, `## ${key}`]);
    }
  }

  const tocBlock =
    config.includeTableOfContents !== false && tocSectionTitles.length > 0
      ? `## Table of Contents\n\n${tocSectionTitles
          .map(([title]) => {
            const slug = title
              .toLowerCase()
              .replaceAll(/[^a-z0-9 -]/g, "")
              .trim()
              .replaceAll(/\s+/g, "-");
            return `- [${title}](#${slug})`;
          })
          .join("\n")}`
      : "";

  const readmeContent = [
    bannerBlock,
    titleBlock,
    badgesBlock,
    config.description,
    tocBlock,
    featuresBlock,
    prerequisitesBlock,
    quickStartBlock,
    installationBlock,
    manualInstallationBlock,
    usageBlock,
    commandsBlock,
    globalFlagsBlock,
    docsBlock,
    quickStartLinkBlock,
    supportBlock,
    contributingBlock,
    securityBlock,
    licenseBlock,
    customSectionsBlock,
    footerBlock,
  ]
    .filter((section) => isNonEmpty(section))
    .join("\n\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .replace(/\n{2,}$/, "\n");

  return `${readmeContent.trim()}\n`;
};
