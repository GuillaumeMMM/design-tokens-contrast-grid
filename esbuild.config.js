import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["src/scripts/script.ts", "src/styles.css"],
  outdir: "build",
  outExtension: {
    ".css": ".css",
  },
  minify: true,
  format: "esm",
  treeShaking: true,
  splitting: true,
  write: true,
  loader: {
    ".css": "css",
  },
  metafile: true,
});

process.exit(0);
