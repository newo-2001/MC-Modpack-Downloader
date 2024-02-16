import { Container } from "inversify";
import "reflect-metadata";
import { DownloadOrchestrator } from "./download-orchestrator.js";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { CurseForgeModProvider } from "./mod-providers/curseforge/curseforge-mod-provider.js";
import { ModpacksChModProvider } from "./mod-providers/modpacks.ch/modpacks.ch-mod-provider.js";
import { LocalModProvider } from "./mod-providers/local/local-mod-provider.js";
import { Settings, registerSettings } from "./settings.js";
import { exit } from "process";
import { Logger } from "winston";
import { isDirectoryEmpty } from "./utils.js";
import { registerLogger } from "./logging.js";
import { inquireModProvider, warnNonEmptyOutputDirectory } from "./interactive.js";
import { ModpacksChModpackIdResolver } from "./mod-providers/modpacks.ch/modpacks.ch-modpack-id-resolver.js";
import { ModpacksChModpackIdentifier } from "./mod-providers/modpacks.ch/modpacks.ch-types.js";
import { FatalError } from "./exceptions.js";

const PROVIDERS = {
    "curseforge": CurseForgeModProvider,
    "modpacks.ch": ModpacksChModProvider,
    "local": LocalModProvider
};

const container = new Container();
await registerSettings(container);
registerLogger(container);

const logger = container.get(Logger);
logger.info(`MC-Modpack-Downloader ${process.env.npm_package_version}`);

const settings = container.get<Settings>(ABSTRACTIONS.Settings.All);
logger.debug(`Using concurrency: ${settings.downloads.concurrency}`);
logger.debug(`Log level set to ${settings.logging.logLevel}`);

if (!await isDirectoryEmpty(settings.downloads.outputDirectory)) {
    if (await warnNonEmptyOutputDirectory()) {
        logger.info("Continuing with non-empty output directory")
    } else {
        exit(0);
    }
}

{
    const provider = process.argv[2] ?? await inquireModProvider();

    if (!(provider in PROVIDERS)) {
        const providerNames = Object.keys(PROVIDERS).join(", ");
        console.error(`Invalid mod provider: '${provider}', it has to be one of: ${providerNames}`);
        exit(1);
    }

    logger.info(`Using ${provider} provider`);

    container.bind(ABSTRACTIONS.Services.CurseForgeModProvider).to(CurseForgeModProvider).inTransientScope();
    container.bind(ABSTRACTIONS.Services.ModProvider).to(PROVIDERS[provider]).inTransientScope();

    await download(provider);
}

async function download(provider: string) {
    const orchestrator = container.resolve(DownloadOrchestrator);
    const modpackId = await resolveModpackId(provider);

    try {
        await orchestrator.downloadAllFromModpackId(modpackId);
    } catch (err) {
        if (err instanceof FatalError) {
            logger.error(err.message);
        } else if (err instanceof Error) {
            logger.error(err.stack);
        } else {
            logger.error("Something went wrong, no error information provided");
        }

        exit(1);
    }
}

async function resolveModpackId(provider: string): Promise<ModpacksChModpackIdentifier | string> {
    switch (provider) {
        case "modpacks.ch":
            return await container.resolve(ModpacksChModpackIdResolver).resolve();
        case "curseforge":
            return "manifest.json"
        case "local":
            return "debug"
    }
}