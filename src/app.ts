import { Container } from "inversify";
import "reflect-metadata";
import { DownloadOrchestrator } from "./download-orchestrator.js";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { CurseForgeModProvider } from "./mod-providers/curseforge/curseforge-mod-provider.js";
import { ModpacksChModProvider } from "./mod-providers/modpacks.ch/modpacks.ch-mod-provider.js";
import { LocalModProvider } from "./mod-providers/local/local-mod-provider.js";
import { Settings, loadSettings } from "./settings.js";
import { exit } from "process";
import { Logger } from "winston";
import { isDirectoryEmpty } from "./utils.js";
import { createLogger } from "./logging.js";
import chalk from "chalk";
import confirm from "@inquirer/confirm";

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

const logger = container.get(Logger);

{
    const version = process.env.npm_package_version;
    logger.info(`MC-Modpack-Downloader ${version}`);
    logger.info(`Using ${provider} provider`);

    logger.debug(`Using concurrency: ${settings.downloads.concurrency}`);
    logger.debug(`Log level set to ${settings.logging.logLevel}`);
}

if (!await isDirectoryEmpty(settings.downloads.outputDirectory)) {
    const response = await confirm({
        message: chalk.yellow("Warning: The output directory is not empty, want to continue anyway?"),
        default: false,
        theme: {
            prefix: '⚠️',
        }
    });

    if (response) {
        logger.info("Continuing with non-empty output directory")
    } else {
        exit(0);
    }
}

{
    const orchestrator = container.resolve(DownloadOrchestrator);
    const modpackId = container.get(ABSTRACTIONS.ModpackId);

    try {
        await orchestrator.downloadAllFromModpackId(modpackId);
    } catch (err) {
        if (err instanceof Error) {
            logger.error(err.message);
            logger.debug(err.stack);
        } else {
            logger.error("Something went wrong, no error information provided")
        }

        process.exitCode = 1;
    }
}

function createDIContainer(): Container {
    const container = new Container();

    container.bind(ABSTRACTIONS.Settings.Downloads).toConstantValue(settings.downloads);
    container.bind(ABSTRACTIONS.Settings.Logging).toConstantValue(settings.logging);
    container.bind(ABSTRACTIONS.Settings.Providers.CurseForge).toConstantValue(settings.curseforge);

    const logger = createLogger(container.get(ABSTRACTIONS.Settings.Logging));
    container.bind(Logger).toConstantValue(logger);

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