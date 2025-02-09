import { Container } from "inversify";
import "reflect-metadata";
import { DownloadOrchestrator } from "./download-orchestrator.js";
import { CurseForgeModProvider } from "./mod-providers/curseforge/curseforge-mod-provider.js";
import { LocalModProvider } from "./mod-providers/local/local-mod-provider.js";
import { exit } from "process";
import { Logger } from "winston";
import { isDirectoryEmpty } from "./utils.js";
import { registerLogger } from "./logging.js";
import { inquireModProvider, warnNonEmptyOutputDirectory } from "./interactive.js";
import { FatalError } from "./exceptions.js";
import { ModProviderName } from "./mod-providers/mod-provider.js";
import { ABSTRACTIONS } from "./abstractions.js";
import { loadConfiguration, registerConfiguration } from "./configuration/configuration.js";
import * as _ from "lodash-es";
import { HttpClient } from "./http-client.js";
import { FTBModProvider } from "./mod-providers/ftb/ftb-mod-provider.js";

const providers = {
    "curseforge": CurseForgeModProvider,
    "modpacks.ch": FTBModProvider,
    "ftb": FTBModProvider,
    "local": LocalModProvider
};

async function getProviderName(provider?: string): Promise<ModProviderName> {
    if (!provider || provider.startsWith('-')) {
        return await inquireModProvider();
    } else if (Object.keys(providers).includes(provider)) {
        return provider as ModProviderName;
    } else {
        throw new Error(`Invalid mod provider: '${provider}'; has to be one of: ${Object.keys(providers).join(", ")}`);
    }
}

export async function run(argv: string[] = process.argv) {
    let provider: ModProviderName = await getProviderName(argv[2]);

    const config = await loadConfiguration(provider, argv);

    const container = new Container();
    registerConfiguration(container, config);
    registerLogger(container);

    container.bind(ABSTRACTIONS.Services.ModProvider).to(providers[provider]).inTransientScope();
    container.bind(ABSTRACTIONS.Services.CurseForgeModProvider).to(CurseForgeModProvider).inTransientScope();
    container.bind(ABSTRACTIONS.HttpClients.CurseForge).toFactory<HttpClient, [string]>(ctx => {
        return (apiKey: string) => {
            const headers = { "x-api-key": apiKey };
            return new HttpClient("https://api.curseforge.com/v1", headers, ctx.container.get(Logger));
        }
    });

    container.bind(ABSTRACTIONS.HttpClients.FTB).toDynamicValue(ctx => {
        return new HttpClient("https://api.feed-the-beast.com/v1/modpacks/public", {}, ctx.container.get(Logger))
    }).inTransientScope();

    const logger = container.get(Logger);

    {
        logger.info(`MC-Modpack-Downloader ${process.env.npm_package_version}`);
        logger.debug(`Invoked with arguments: ${argv.slice(2).join(" ")}`);

        let redactedConfig = _.cloneDeep(config) as any;
        delete redactedConfig.curseforge.apiKey;

        if (provider == "modpacks.ch") {
            logger.warn("The 'modpacks.ch' provider is depcrecated, falling back to ftb")
            provider = "ftb";
        }

        logger.debug(`Using configuration: ${JSON.stringify(redactedConfig)}`);
    }

    if (!await isDirectoryEmpty(config.downloads.outputDirectory)) {
        if (config.confirmAll) {
            logger.warn("Output directory is not empty");
        } else if (await warnNonEmptyOutputDirectory()) {
            logger.info("Continuing with non-empty output directory");
        } else {
            exit(0);
        }
    }

    const modpackId = {
        "ftb": config.ftb.modpack,
        "curseforge": config.curseforge.manifestFile,
        "local": "debug"
    }[provider];

    const orchestrator = container.resolve(DownloadOrchestrator);

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