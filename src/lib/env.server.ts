/** Load local .env values for Node-side server functions without exposing them. */
export function loadServerEnv(): void {
  if (typeof process.loadEnvFile !== "function") return;
  try {
    process.loadEnvFile();
  } catch (error) {
    console.error("[env] failed to load local environment", {
      code: error instanceof Error ? error.name : "unknown",
    });
  }
}
