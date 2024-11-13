import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["src/scripts/script.ts"],
  outdir: "src",
  minify: true,
  format: "esm",
  treeShaking: true,
  splitting: true,
  write: true,
});

process.exit(0);
