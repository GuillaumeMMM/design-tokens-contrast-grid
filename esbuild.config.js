import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["src/script.ts"],
  outdir: "build",
  minify: true,
  format: "esm",
  treeShaking: true,
  splitting: true,
  write: true,
});

process.exit(0);
