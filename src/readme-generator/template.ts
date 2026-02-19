import type {
	ReadieBadge,
	ReadieConfig,
	ReadieLicenseObject,
} from "#src/config/types.js";

const isNonEmpty = (value?: string | null): value is string =>
	typeof value === "string" && value.trim().length > 0;

const normalizeSections = (sections: string[]) =>
	sections
		.join("\n")
		.replaceAll(/\n{3,}/g, "\n\n")
		.trim();

const appendUsageItem = (lines: string[], item: string, index: number) => {
	if (item.startsWith("```")) {
		if (lines.length > 0 && lines.at(-1) !== "") {
			lines.push("");
		}
		lines.push(item);
		lines.push("");
		return index;
	}

	const cleaned = item.startsWith("- ") ? item.slice(2) : item;
	lines.push(`${index}. ${cleaned}`);
	return index + 1;
};

const renderNumberedWithCodeBlocks = (items: string[]) => {
	const lines: string[] = [];
	let i = 1;

	for (const rawItem of items) {
		const item = rawItem.trim();
		if (!item) {
			continue;
		}
		i = appendUsageItem(lines, item, i);
	}

	return normalizeSections(lines);
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

const renderHeadingBlock = (
	heading: string,
	content: string | undefined
): string => {
	if (!isNonEmpty(content)) {
		return "";
	}
	if (content.trimStart().startsWith("## ")) {
		return content;
	}
	return `${heading}\n\n${content}`;
};

const renderBadges = (badges: ReadieBadge[] | undefined) => {
	if (!badges || badges.length === 0) {
		return "";
	}
	return badges
		.map((badge) => {
			const image = `![${badge.label}](${badge.image})`;
			return isNonEmpty(badge.link) ? `[${image}](${badge.link})` : image;
		})
		.join("\n");
};

const renderSimpleListSection = (
	heading: string,
	items: string[] | undefined,
	formatter: (value: string) => string = (value) => value
) => {
	if (!items || items.length === 0) {
		return "";
	}
	return `${heading}\n\n${items.map(formatter).join("\n")}`;
};

const renderCommandsSection = (config: ReadieConfig) =>
	renderSimpleListSection(
		"## Available Commands",
		config.commands?.map((cmd) => `- \`${cmd.name}\`: ${cmd.description}`)
	);

const renderGlobalFlagsSection = (config: ReadieConfig) =>
	renderSimpleListSection(
		"## Global Flags",
		config.globalFlags?.map((flag) => `- \`${flag.flag}\`: ${flag.description}`)
	);

const renderLicenseBlock = (license: ReadieConfig["license"]) => {
	if (!license) {
		return "";
	}
	if (typeof license === "string") {
		return renderHeadingBlock("## License", license);
	}
	const { name, url } = license as ReadieLicenseObject;
	return `## License\n\n[${name}](${url})`;
};

interface ReadmeSections {
	bannerBlock: string;
	titleBlock: string;
	badgesBlock: string;
	featuresBlock: string;
	prerequisitesBlock: string;
	quickStartBlock: string;
	installationBlock: string;
	manualInstallationBlock: string;
	usageBlock: string;
	commandsBlock: string;
	globalFlagsBlock: string;
	docsBlock: string;
	quickStartLinkBlock: string;
	supportBlock: string;
	contributingBlock: string;
	securityBlock: string;
	licenseBlock: string;
	customSectionsBlock: string;
	footerBlock: string;
}

const createReadmeSections = (config: ReadieConfig): ReadmeSections => {
	const bannerBlock = isNonEmpty(config.banner) ? config.banner : "";
	const titleBlock =
		isNonEmpty(bannerBlock) && bannerBlock.toLowerCase().includes("<h1")
			? ""
			: `# ${config.title}`;

	return {
		badgesBlock: renderBadges(config.badges),
		bannerBlock,
		commandsBlock: renderCommandsSection(config),
		contributingBlock: addSection("## Contributing", config.contributing),
		customSectionsBlock: config.customSections
			? Object.entries(config.customSections)
					.map(([heading, content]) => `## ${heading}\n\n${content}`)
					.join("\n\n")
			: "",
		docsBlock: config.docsLink
			? `## Documentation

For further information, guides, and examples visit the [reference documentation](${config.docsLink}).`
			: "",
		featuresBlock: renderSimpleListSection(
			"## Key Features",
			config.features,
			(feature) => `- ${feature}`
		),
		footerBlock: isNonEmpty(config.footer) ? config.footer : "",
		globalFlagsBlock: renderGlobalFlagsSection(config),
		installationBlock: renderSimpleListSection(
			"## Installation",
			config.installation
		),
		licenseBlock: renderLicenseBlock(config.license),
		manualInstallationBlock: renderSimpleListSection(
			"## Manual Installation",
			config.manualInstallation
		),
		prerequisitesBlock: addSection("## Prerequisites", config.prerequisites),
		quickStartBlock: renderHeadingBlock("## Quick Start", config.quickStart),
		quickStartLinkBlock: config.quickStartLink
			? `## Additional Quick Start

See the full quick start guide [here](${config.quickStartLink}).`
			: "",
		securityBlock: renderHeadingBlock("## Security", config.security),
		supportBlock: addSection("## Support", config.support),
		titleBlock,
		usageBlock: config.usage
			? `## Usage\n\n${renderNumberedWithCodeBlocks(config.usage)}`
			: "",
	};
};

const slugifyHeading = (title: string) =>
	title
		.toLowerCase()
		.replaceAll(/[^a-z0-9 -]/g, "")
		.trim()
		.replaceAll(/\s+/g, "-");

type TocTitleEntry = [title: string, section: string];

const createTocTitles = (config: ReadieConfig, sections: ReadmeSections) => {
	const tocSectionTitles: TocTitleEntry[] = [
		["Key Features", sections.featuresBlock],
		["Prerequisites", sections.prerequisitesBlock],
		["Quick Start", sections.quickStartBlock],
		["Installation", sections.installationBlock],
		["Manual Installation", sections.manualInstallationBlock],
		["Usage", sections.usageBlock],
		["Available Commands", sections.commandsBlock],
		["Global Flags", sections.globalFlagsBlock],
		["Documentation", sections.docsBlock],
		["Additional Quick Start", sections.quickStartLinkBlock],
		["Support", sections.supportBlock],
		["Contributing", sections.contributingBlock],
		["Security", sections.securityBlock],
		["License", sections.licenseBlock],
	];
	const visibleTocSectionTitles = tocSectionTitles.filter(([, section]) =>
		isNonEmpty(section)
	);

	if (!isNonEmpty(sections.customSectionsBlock)) {
		return visibleTocSectionTitles;
	}

	for (const key of Object.keys(config.customSections ?? {})) {
		visibleTocSectionTitles.push([key, `## ${key}`]);
	}
	return visibleTocSectionTitles;
};

const createTocBlock = (
	includeTableOfContents: boolean | undefined,
	titles: TocTitleEntry[]
) => {
	if (includeTableOfContents === false || titles.length === 0) {
		return "";
	}
	const links = titles
		.map(([title]) => `- [${title}](#${slugifyHeading(title)})`)
		.join("\n");
	return `## Table of Contents\n\n${links}`;
};

export const baseReadmeTemplate = (rawConfig: ReadieConfig) => {
	const config: ReadieConfig = { ...rawConfig };
	const sections = createReadmeSections(config);
	const tocTitles = createTocTitles(config, sections);
	const tocBlock = createTocBlock(config.includeTableOfContents, tocTitles);

	const readmeContent = [
		sections.bannerBlock,
		sections.titleBlock,
		sections.badgesBlock,
		config.description,
		tocBlock,
		sections.featuresBlock,
		sections.prerequisitesBlock,
		sections.quickStartBlock,
		sections.installationBlock,
		sections.manualInstallationBlock,
		sections.usageBlock,
		sections.commandsBlock,
		sections.globalFlagsBlock,
		sections.docsBlock,
		sections.quickStartLinkBlock,
		sections.supportBlock,
		sections.contributingBlock,
		sections.securityBlock,
		sections.licenseBlock,
		sections.customSectionsBlock,
		sections.footerBlock,
	]
		.filter((section) => isNonEmpty(section))
		.join("\n\n")
		.replaceAll(/\n{3,}/g, "\n\n")
		.replace(/\n{2,}$/, "\n");

	return `${readmeContent.trim()}\n`;
};
