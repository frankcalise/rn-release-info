import dts from "bun-plugin-dts";

await Bun.build({
  entrypoints: ["./src/collect-pick-info.ts"],
  outdir: "./dist",
  minify: true,
  plugins: [dts()],
});
