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
import chalk from "chalk";
import confirm from "@inquirer/confirm";
import select from "@inquirer/select";

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


const provider = process.argv[2] ?? await inquireProvider();

async function inquireProvider(): Promise<ModProvider> {
    return await select<ModProvider>({
        message: chalk.blue("What mod provider do you want to use?"),
        choices: [
            {
                name: "CurseForge",
                value: "curseforge" as ModProvider
            },
            {
                name: "modpacks.ch (FTB)",
                value: "modpacks.ch" as ModProvider
            }
        ]
    })
}

type ModProvider = "curseforge" | "modpacks.ch" | "local";

if (!(provider in PROVIDERS)) {
    const providerNames = Object.keys(PROVIDERS).join(", ");
    console.error(`Invalid mod provider: '${provider}', it has to be one of: ${providerNames}`);
    exit(1);
}

logger.info(`Using ${provider} provider`);

container.bind(ABSTRACTIONS.Services.CurseForgeModProvider).to(CurseForgeModProvider).inTransientScope();
container.bind(ABSTRACTIONS.Services.ModProvider).to(PROVIDERS[provider]).inTransientScope();

switch (provider) {
    case "curseforge":
        container.bind(ABSTRACTIONS.ModpackId).toConstantValue("manifest.json");
        break;
    case "modpacks.ch":
        container.bind(ABSTRACTIONS.ModpackId).toConstantValue(settings["modpacks.ch"].modpack);
        break;
    case "local":
        container.bind(ABSTRACTIONS.ModpackId).toConstantValue("debug");
        break;
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

        exit(1);
    }
}