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

export const resolveInvocation = (args: string[]): ResolvedInvocation => {
  const [first, ...rest] = args;

  if (!first) {
    return {
      commandArgs: [],
      mode: "generate",
      originalArgs: args,
    };
  }

  if (isHelpFlag(first)) {
    return {
      commandArgs: rest,
      mode: "help",
      originalArgs: args,
    };
  }

  if (first === "generate") {
    return {
      commandArgs: rest,
      mode: "generate",
      originalArgs: args,
    };
  }

  if (first === "generate:workspace") {
    return {
      commandArgs: rest,
      mode: "generate:workspace",
      originalArgs: args,
    };
  }

  if (first === "init") {
    return {
      commandArgs: rest,
      mode: "init",
      originalArgs: args,
    };
  }

  if (first === "help") {
    return {
      commandArgs: rest,
      mode: "help",
      originalArgs: args,
    };
  }

  return {
    commandArgs: args,
    mode: "unknown",
    originalArgs: args,
  };
};
