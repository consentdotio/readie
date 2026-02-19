import type {
	ReadieBadge,
	ReadieConfig,
	ReadieLicenseObject,
} from "#src/config/types.js";

const isNonEmpty = (value?: string | null): value is string =>
	typeof value === "string" && value.trim().length > 0;

/**
 * Collapses excessive blank lines between rendered markdown fragments.
 */
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

/**
 * Renders a markdown section when content is present.
 */
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

/**
 * Renders free-form section content and preserves already-headed markdown.
 */
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
	/** Optional top-of-file banner block. */
	bannerBlock: string;
	/** Main H1 title block. */
	titleBlock: string;
	/** Rendered badges block. */
	badgesBlock: string;
	/** Key Features section block. */
	featuresBlock: string;
	/** Prerequisites section block. */
	prerequisitesBlock: string;
	/** Quick Start section block. */
	quickStartBlock: string;
	/** Installation section block. */
	installationBlock: string;
	/** Manual Installation section block. */
	manualInstallationBlock: string;
	/** Usage section block. */
	usageBlock: string;
	/** Available Commands section block. */
	commandsBlock: string;
	/** Global Flags section block. */
	globalFlagsBlock: string;
	/** Documentation link section block. */
	docsBlock: string;
	/** Additional Quick Start link section block. */
	quickStartLinkBlock: string;
	/** Support section block. */
	supportBlock: string;
	/** Contributing section block. */
	contributingBlock: string;
	/** Security section block. */
	securityBlock: string;
	/** License section block. */
	licenseBlock: string;
	/** Concatenated custom section blocks. */
	customSectionsBlock: string;
	/** Optional trailing footer block. */
	footerBlock: string;
}

/**
 * Builds all top-level section blocks from a readie config.
 */
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

/**
 * Creates unique heading anchors by suffixing duplicate slugs.
 */
const createUniqueSlug = (title: string, seenSlugs: Map<string, number>) => {
	const baseSlug = slugifyHeading(title);
	const count = seenSlugs.get(baseSlug) ?? 0;
	seenSlugs.set(baseSlug, count + 1);
	return count === 0 ? baseSlug : `${baseSlug}-${count}`;
};

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

/**
 * Renders a table of contents block from visible section titles.
 */
const createTocBlock = (
	includeTableOfContents: boolean | undefined,
	titles: TocTitleEntry[]
) => {
	if (includeTableOfContents === false || titles.length === 0) {
		return "";
	}
	const seenSlugs = new Map<string, number>();
	const links = titles
		.map(([title]) => `- [${title}](#${createUniqueSlug(title, seenSlugs)})`)
		.join("\n");
	return `## Table of Contents\n\n${links}`;
};

/**
 * Generates README markdown content for a project config.
 *
 * @param {ReadieConfig} rawConfig - Fully merged config used to render the README.
 * @returns {string} Rendered README markdown with a trailing newline.
 */
export const baseReadmeTemplate = (rawConfig: ReadieConfig) => {
	const sections = createReadmeSections(rawConfig);
	const tocTitles = createTocTitles(rawConfig, sections);
	const tocBlock = createTocBlock(rawConfig.includeTableOfContents, tocTitles);

	const readmeContent = [
		sections.bannerBlock,
		sections.titleBlock,
		sections.badgesBlock,
		rawConfig.description,
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
