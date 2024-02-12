import { CurseForgeModProviderSettings } from "./mod-providers/curseforge/curseforge-types.js";
import { ModpacksChModProviderSettings } from "./mod-providers/modpacks.ch/modpacks.ch-types.js";
import { readJsonFile } from "./utils.js";
import { defaultComposer } from "default-composer";

export interface Settings {
    logging: LoggingSettings,
    downloads: DownloadSettings,
    curseforge: CurseForgeModProviderSettings,
    "modpacks.ch": ModpacksChModProviderSettings
}

export interface DownloadSettings {
    concurrency: number,
    outputDirectory: string
}

export interface LoggingSettings {
    logLevel: string,
    logFile: string
}

const defaults = {
    logging: {
        logFile: "latest.log",
        logLevel: "debug"
    },
    downloads: {
        concurrency: 20,
        outputDirectory: "mods",
    }
};

export async function loadSettings(file: string = "settings.json"): Promise<Settings> {
    try {
        const settings = await readJsonFile(file);
        return defaultComposer<Settings>(defaults, settings);
    } catch {
        throw new Error("Failed to load settings.json, please copy settings.example.json and enter the appropriate information.");
    }
}