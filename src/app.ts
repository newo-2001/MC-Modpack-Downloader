import { Container } from "inversify";
import "reflect-metadata";
import { DownloadOrchestrator } from "./download-orchestrator.js";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { CurseForgeModProvider } from "./mod-providers/curseforge/curseforge-mod-provider.js";
import { ModpacksChModProvider } from "./mod-providers/modpacks.ch/modpacks.ch-mod-provider.js";
import { LocalModProvider } from "./mod-providers/local/local-mod-provider.js";
import { Settings, loadSettings } from "./settings.js";
import { exit } from "process";

let settings: Settings;

const PROVIDERS = {
    "curseforge": CurseForgeModProvider,
    "modpacks.ch": ModpacksChModProvider,
    "local": LocalModProvider
};

const provider = process.argv[2];
if (!isValidModProvider(provider)) {
    const providerNames = Object.keys(PROVIDERS).join(", ");
    console.error(`Invalid mod provider: '${provider}', it has to be one of: ${providerNames}`);
    exit(1);
}

console.log(`Using ${provider} mod provider`);

settings = await loadSettings();

const container = createDIContainer();
registerDependencies(provider, container);

const orchestrator = container.resolve(DownloadOrchestrator);
const modpackId = container.get(ABSTRACTIONS.ModpackId);

try {
    await orchestrator.downloadAllFromModpackId(modpackId);
} catch (err) {
    console.error(err);
}

function createDIContainer(): Container {
    const container = new Container();

    container.bind(ABSTRACTIONS.Settings.Downloads).toConstantValue(settings.downloads);
    container.bind(ABSTRACTIONS.Settings.Providers.CurseForge).toConstantValue(settings.curseforge);
    container.bind(ABSTRACTIONS.Services.CurseForgeModProvider).to(CurseForgeModProvider).inTransientScope();
    
    return container;
}

function registerDependencies(provider: ModProvider, container: Container): void {
    container.bind(ABSTRACTIONS.Services.ModProvider).to(PROVIDERS[provider]).inTransientScope();

    switch (provider) {
        case "curseforge":
            container.bind(ABSTRACTIONS.ModpackId).toConstantValue("manifest.json");
            break;
        case "modpacks.ch":
            container.bind(ABSTRACTIONS.ModpackId).toConstantValue(settings["modpacks.ch"].modpack)
            break;
        case "local":
            container.bind(ABSTRACTIONS.ModpackId).toConstantValue("debug");
            break;
    }
}

type ModProvider = "curseforge" | "modpacks.ch" | "local";

function isValidModProvider(provider: string): provider is ModProvider {
    return provider in PROVIDERS;
}