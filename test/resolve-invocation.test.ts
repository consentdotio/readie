import { resolveInvocation } from "#src/cli/resolve-invocation.js";

describe("resolve invocation routing", () => {
	it("defaults to generate when no args are passed", () => {
		const resolved = resolveInvocation([]);
		expect(resolved.mode).toBe("generate");
		expect(resolved.commandArgs).toStrictEqual([]);
		expect(resolved.originalArgs).toStrictEqual([]);
	});

	it("routes explicit generate command", () => {
		const args = ["generate", "--config", "readie.json"];
		const resolved = resolveInvocation(args);
		expect(resolved.mode).toBe("generate");
		expect(resolved.commandArgs).toStrictEqual(["--config", "readie.json"]);
		expect(resolved.originalArgs).toStrictEqual(args);
	});

	it("routes workspace subcommand", () => {
		const resolved = resolveInvocation([
			"generate:workspace",
			"--root",
			"./packages",
		]);
		expect(resolved.mode).toBe("generate:workspace");
		expect(resolved.commandArgs).toStrictEqual(["--root", "./packages"]);
		expect(resolved.originalArgs).toStrictEqual([
			"generate:workspace",
			"--root",
			"./packages",
		]);
	});

	it("routes init subcommand", () => {
		const resolved = resolveInvocation(["init", "--force"]);
		expect(resolved.mode).toBe("init");
		expect(resolved.commandArgs).toStrictEqual(["--force"]);
		expect(resolved.originalArgs).toStrictEqual(["init", "--force"]);
	});

	it("routes --help to help mode", () => {
		const resolved = resolveInvocation(["--help"]);
		expect(resolved.mode).toBe("help");
		expect(resolved.commandArgs).toStrictEqual([]);
		expect(resolved.originalArgs).toStrictEqual(["--help"]);
	});

	it("routes -h to help mode", () => {
		const resolved = resolveInvocation(["-h"]);
		expect(resolved.mode).toBe("help");
		expect(resolved.commandArgs).toStrictEqual([]);
		expect(resolved.originalArgs).toStrictEqual(["-h"]);
	});

	it("routes help command to help mode", () => {
		const resolved = resolveInvocation(["help"]);
		expect(resolved.mode).toBe("help");
		expect(resolved.commandArgs).toStrictEqual([]);
		expect(resolved.originalArgs).toStrictEqual(["help"]);
	});

	it("routes unknown commands to unknown mode", () => {
		const args = ["invalid-command", "--flag"];
		const resolved = resolveInvocation(args);
		expect(resolved.mode).toBe("unknown");
		expect(resolved.commandArgs).toStrictEqual(args);
		expect(resolved.originalArgs).toStrictEqual(args);
	});
});
