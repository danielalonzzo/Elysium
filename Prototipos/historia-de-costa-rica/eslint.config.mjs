import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /*
     * Las carpetas de verdad llevan el sufijo `.nosync` (la marca que mantiene
     * a iCloud fuera de ellas); `node_modules` y `.next` son enlaces simbólicos
     * que apuntan ahí. ESLint resuelve el enlace antes de comparar, así que sus
     * ignorados por defecto no las alcanzan y acababa analizando las
     * dependencias enteras: 160 000 avisos que tapaban los del proyecto. Es el
     * mismo motivo por el que `tsconfig.json` tiene que excluirlas por ese
     * nombre (ver CLAUDE.md).
     */
    "node_modules.nosync/**",
    ".next.nosync/**",
    ".next-export.nosync/**",
  ]),
]);

export default eslintConfig;
