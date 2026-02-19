export const printRootHelp = () => {
	console.log(`readie

Generate high-quality README files from readie.json.

Usage:
  readie [options]
  readie generate [options]
  readie generate:workspace [options]
  readie init [options]

Commands:
  generate             Generate one README from a config file (default command)
  generate:workspace   Generate READMEs for multiple projects in a workspace
  init                 Create a starter readie.json config

Examples:
  npx readie
  npx readie generate --config ./readie.json
  npx readie generate:workspace --root ./packages --config-name readie.json
  npx readie init
`);
};
