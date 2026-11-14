import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { prettier, sharedIgnores } from "./base.mjs";

export default function nextConfig(appDir) {
	return defineConfig(
		sharedIgnores,
		nextVitals,
		nextTs,
		{ settings: { next: { rootDir: appDir } } },
		prettier,
	);
}
