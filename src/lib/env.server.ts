/** Load local .env values for Node-side server functions without exposing them. */
export function loadServerEnv(): void {
  // Vercel injects Production/Preview environment variables directly into the
  // runtime. Never try to read a local .env file there; process.loadEnvFile()
  // is a local-development convenience and can emit a misleading runtime
  // error when the deployment has no .env file.
  if (process.env.VERCEL === "1") return;
  if (typeof process.loadEnvFile !== "function") return;

  try {
    process.loadEnvFile();
  } catch (error) {
    // A missing local .env is not fatal by itself; required variables are
    // validated at the point where the corresponding service is used.
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    console.warn("[env] local environment file could not be loaded", {
      code: error instanceof Error ? error.name : "unknown",
    });
  }
}
