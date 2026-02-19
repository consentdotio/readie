import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			all: true,
			exclude: ["**/*.d.ts", "dist/**", "node_modules/**", "test/**"],
			include: [
				"src/cli/resolve-invocation.ts",
				"src/config/load-config.ts",
				"src/readme-generator/**/*.ts",
			],
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			thresholds: {
				branches: 70,
				functions: 80,
				lines: 80,
				statements: 80,
			},
		},
		globals: true,
	},
});
