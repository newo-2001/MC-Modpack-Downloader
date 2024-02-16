import { Container } from "inversify";
import { CurseForgeModProviderSettings } from "./mod-providers/curseforge/curseforge-types.js";
import { ModpacksChModProviderSettings } from "./mod-providers/modpacks.ch/modpacks.ch-types.js";
import { readJsonFile } from "./utils.js";
import { defaultComposer } from "default-composer";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";

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
    },
    ["modpacks.ch"]: {}
};

async function loadSettings(file: string = "settings.json"): Promise<Settings> {
    try {
        const settings = await readJsonFile(file);
        return defaultComposer<Settings>(defaults, settings);
    } catch {
        throw new Error("Failed to load settings.json, please copy settings.example.json and enter the appropriate information.");
    }
}

export async function registerSettings(container: Container) {
    const settings = await loadSettings();

    container.bind(ABSTRACTIONS.Settings.Downloads).toConstantValue(settings.downloads);
    container.bind(ABSTRACTIONS.Settings.Logging).toConstantValue(settings.logging);
    container.bind(ABSTRACTIONS.Settings.Providers.CurseForge).toConstantValue(settings.curseforge);
    container.bind(ABSTRACTIONS.Settings.Providers.ModpacksCh).toConstantValue(settings["modpacks.ch"]);
    container.bind(ABSTRACTIONS.Settings.All).toConstantValue(settings);
}