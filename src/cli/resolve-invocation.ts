export type InvocationMode =
  | "generate"
  | "generate:workspace"
  | "init"
  | "help"
  | "unknown";

export interface ResolvedInvocation {
  mode: InvocationMode;
  commandArgs: string[];
  originalArgs: string[];
}

const isHelpFlag = (value: string | undefined) =>
  value === "--help" || value === "-h";

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

export const resolveInvocation = (args: string[]): ResolvedInvocation => {
  const [first, ...rest] = args;
  const mode = modeFromToken(first);

  return {
    commandArgs: mode === "unknown" ? args : rest,
    mode,
    originalArgs: args,
  };
};
