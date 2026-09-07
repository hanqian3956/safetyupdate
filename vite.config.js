import { defineConfig } from "vite";
import { readFileSync } from "node:fs";

// Relative asset URLs keep static pages working when hosted below a platform path.
export default defineConfig({
  base: "./",
  plugins: [{
    name: "publish-product-specification",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "spec.md",
        source: readFileSync(new URL("./spec.md", import.meta.url), "utf8"),
      });
    },
  }],
});
