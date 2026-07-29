// Cloudflare Workers entrypoint that serves the Vite static build.
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
