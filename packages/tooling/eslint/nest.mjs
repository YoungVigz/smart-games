import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import { prettier, sharedIgnores } from "./base.mjs";

export default function nestConfig(appDir) {
	return defineConfig(
		sharedIgnores,
		{
			files: ["**/*.{js,mjs,cjs}"],
			extends: [js.configs.recommended],
			languageOptions: { globals: globals.node },
		},
		{
			files: ["**/*.{ts,mts,cts}"],
			extends: [
				js.configs.recommended,
				tseslint.configs.recommendedTypeChecked,
			],
			languageOptions: {
				globals: { ...globals.node, ...globals.jest },
				parserOptions: {
					projectService: true,
					tsconfigRootDir: appDir,
				},
			},
			rules: {
				"@typescript-eslint/no-explicit-any": "off",
				"@typescript-eslint/no-floating-promises": "warn",
				"@typescript-eslint/no-unsafe-argument": "warn",
			},
		},
		prettier,
	);
}
