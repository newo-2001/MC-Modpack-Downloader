import { readJsonFile } from "../utils.js";
import { PartialConfiguration } from "./configuration.js";

export async function getJsonConfiguration(): Promise<PartialConfiguration> {
    try {
        return await readJsonFile("settings.json");
    } catch {
        // We can't log using winston because we need configuration to initialize it
        console.warn("Failed to load settings.json, using default values.")
        return {};
    }
}
