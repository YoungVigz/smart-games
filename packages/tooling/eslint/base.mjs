import { globalIgnores } from "eslint/config";

export { default as prettier } from "eslint-config-prettier/flat";

export const sharedIgnores = globalIgnores([
	"**/.next/",
	"**/dist/",
	"**/build/",
	"**/out/",
	"**/coverage/",
	"**/generated/",
	"**/next-env.d.ts",
]);
