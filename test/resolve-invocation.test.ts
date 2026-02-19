import { resolveInvocation } from "#src/cli/resolve-invocation.js";

describe("resolve invocation routing", () => {
	it("defaults to generate when no args are passed", () => {
		const resolved = resolveInvocation([]);
		expect(resolved.mode).toBe("generate");
		expect(resolved.commandArgs).toStrictEqual([]);
	});

	it("routes workspace subcommand", () => {
		const resolved = resolveInvocation([
			"generate:workspace",
			"--root",
			"./packages",
		]);
		expect(resolved.mode).toBe("generate:workspace");
		expect(resolved.commandArgs).toStrictEqual(["--root", "./packages"]);
	});

	it("routes init subcommand", () => {
		const resolved = resolveInvocation(["init", "--force"]);
		expect(resolved.mode).toBe("init");
		expect(resolved.commandArgs).toStrictEqual(["--force"]);
	});
});
