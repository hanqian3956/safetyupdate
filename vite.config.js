import { defineConfig } from "vite";

// Relative asset URLs keep static pages working when hosted below a platform path.
export default defineConfig({
  base: "./",
});
