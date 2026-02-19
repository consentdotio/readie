export type InvocationMode = 'generate' | 'generate:workspace' | 'init' | 'help' | 'unknown';

export interface ResolvedInvocation {
  mode: InvocationMode;
  commandArgs: string[];
  originalArgs: string[];
}

const isHelpFlag = (value: string | undefined) => value === '--help' || value === '-h';

export const resolveInvocation = (args: string[]): ResolvedInvocation => {
  const [first, ...rest] = args;

  if (!first) {
    return {
      mode: 'generate',
      commandArgs: [],
      originalArgs: args,
    };
  }

  if (isHelpFlag(first)) {
    return {
      mode: 'help',
      commandArgs: rest,
      originalArgs: args,
    };
  }

  if (first === 'generate') {
    return {
      mode: 'generate',
      commandArgs: rest,
      originalArgs: args,
    };
  }

  if (first === 'generate:workspace') {
    return {
      mode: 'generate:workspace',
      commandArgs: rest,
      originalArgs: args,
    };
  }

  if (first === 'init') {
    return {
      mode: 'init',
      commandArgs: rest,
      originalArgs: args,
    };
  }

  if (first === 'help') {
    return {
      mode: 'help',
      commandArgs: rest,
      originalArgs: args,
    };
  }

  return {
    mode: 'unknown',
    commandArgs: args,
    originalArgs: args,
  };
};
