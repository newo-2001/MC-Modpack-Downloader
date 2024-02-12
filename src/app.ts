import { Container } from "inversify";
import "reflect-metadata";
import { DownloadOrchestrator } from "./download-orchestrator.js";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { CurseForgeModProvider } from "./mod-providers/curseforge/curseforge-mod-provider.js";
import { ModpacksChModProvider } from "./mod-providers/modpacks.ch/modpacks.ch-mod-provider.js";
import { LocalModProvider } from "./mod-providers/local/local-mod-provider.js";
import { Settings, loadSettings } from "./settings.js";
import { exit } from "process";
import { Logger, createLogger, format, transports } from "winston";

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

settings = await loadSettings();

const container = createDIContainer();
registerDependencies(provider, container);

const orchestrator = container.resolve(DownloadOrchestrator);
const modpackId = container.get(ABSTRACTIONS.ModpackId);
const logger = container.get(Logger);

{
    let version = process.env.npm_package_version;
    console.log(`MC-Modpack-Downloader ${version}`);
    logger.info(`MC-Modpack-Downloader ${version}`);

    console.log(`Using ${provider} mod provider`);
    logger.info(`Using ${provider} provider`);

    logger.info(`Using concurrency: ${settings.downloads.concurrency}`);
    logger.info(`Log level set to ${settings.logLevel}`);
}

try {
    await orchestrator.downloadAllFromModpackId(modpackId);
} catch (err) {
    console.error(err);
}

function createDIContainer(): Container {
    const container = new Container();

    container.bind(Logger).toConstantValue(configureLogger());
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

function configureLogger(): Logger {
    const logFormat = format.printf(({ message, level, timestamp }) => {
        return `${timestamp} [${level}] ${message}`;
    })

    return createLogger({
        level: settings.logLevel ?? "debug",
        format: format.combine(format.timestamp(), logFormat),
        transports: [
            new transports.File({
                filename: "latest.log",
                options: { flags: 'w' }
            })
        ]
    })
}