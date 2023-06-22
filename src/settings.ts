import { CurseForgeModProviderSettings } from "./mod-providers/curseforge/curseforge-types.js";
import { ModpacksChModProviderSettings } from "./mod-providers/modpacks.ch/modpacks.ch-types.js";
import { readJsonFile } from "./utils.js";

export interface Settings {
    downloads: DownloadSettings,
    curseforge: CurseForgeModProviderSettings,
    "modpacks.ch": ModpacksChModProviderSettings
}

export interface DownloadSettings {
    concurrency: number,
    outputDirectory: string
}

export async function loadSettings(file: string = "settings.json"): Promise<Settings> {
    try {
        return await readJsonFile<Settings>("settings.json");
    } catch {
        throw new Error("Failed to load settings.json, please copy settings.example.json and enter the appropriate information.");
    }
}