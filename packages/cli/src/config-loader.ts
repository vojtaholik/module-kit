import { join } from "node:path";
import { existsSync } from "node:fs";
import { configSchema, type StaticKitConfig } from "@vojtaholik/static-kit-core";

/**
 * Load static-kit.config.ts from the current working directory
 */
export async function loadConfig(
  cwd = process.cwd()
): Promise<StaticKitConfig> {
  const configPath = join(cwd, "static-kit.config.ts");

  // Check if file exists first
  if (!existsSync(configPath)) {
    console.log("No static-kit.config.ts found, using defaults");
    return configSchema.parse({});
  }

  try {
    // Use file:// URL for dynamic imports
    const configModule = await import(`file://${configPath}`);
    const rawConfig = configModule.default ?? configModule;
    return configSchema.parse(rawConfig);
  } catch (err) {
    console.error("Error loading config:", err);
    throw err;
  }
}

/**
 * Resolve a path relative to the project root
 */
export function resolvePath(
  config: StaticKitConfig,
  key: keyof StaticKitConfig,
  cwd = process.cwd()
): string {
  const value = config[key];
  if (typeof value !== "string") {
    throw new Error(`Config key ${key} is not a string`);
  }
  return join(cwd, value);
}
