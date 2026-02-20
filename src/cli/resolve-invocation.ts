/**
 * Supported high-level invocation modes accepted by the root CLI entrypoint.
 */
export type InvocationMode =
	| "generate"
	| "generate:workspace"
	| "init"
	| "help"
	| "unknown";

/**
 * Normalized invocation data used to route CLI execution.
 */
export interface ResolvedInvocation {
	/** Resolved top-level mode used for command routing. */
	mode: InvocationMode;
	/** Arguments passed to the selected subcommand handler. */
	commandArgs: string[];
	/** Original raw argument list before normalization. */
	originalArgs: string[];
}

/**
 * Checks whether a token is a standard help flag.
 */
const isHelpFlag = (value: string | undefined) =>
	value === "--help" || value === "-h";

/**
 * Maps the first CLI token to a known invocation mode.
 */
const modeFromToken = (token: string | undefined): InvocationMode => {
	if (!token) {
		return "generate";
	}
	if (isHelpFlag(token) || token === "help") {
		return "help";
	}

	const commandModes: Record<string, InvocationMode> = {
		generate: "generate",
		"generate:workspace": "generate:workspace",
		init: "init",
	};

	return commandModes[token] ?? "unknown";
};

/**
 * Resolves CLI arguments into a mode and command argument payload.
 *
 * @param {string[]} args - Raw user arguments after the binary name.
 * @returns {ResolvedInvocation} Invocation details used by the root command dispatcher.
 */
export const resolveInvocation = (args: string[]): ResolvedInvocation => {
	const [first, ...rest] = args;
	const mode = modeFromToken(first);

	return {
		commandArgs: mode === "unknown" ? args : rest,
		mode,
		originalArgs: args,
	};
};
