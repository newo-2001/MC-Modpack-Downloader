import { Container, interfaces } from "inversify";
import { ABSTRACTIONS } from "../abstractions.js";
import { CurseForgeModProviderConfiguration } from "../mod-providers/curseforge/curseforge-types.js";
import { FTBModpackIdentifier, FTBModProviderConfiguration } from "../mod-providers/ftb/ftb-types.js";
import { getJsonConfiguration } from "./json-configuration-source.js";
import { getDefaultConfiguration } from "./default-configuration-source.js";
import { getArgumentConfiguration } from "./arguments-configuration-source.js";
import { ModProviderName } from "../mod-providers/mod-provider.js";
import { inputNumber } from "../interactive.js";
import { DeepPartial } from "../utils.js";
import { getEnvironmentConfiguration } from "./environment-configuration-source.js";
import { LoggingConfiguration } from "../logging.js";
import * as _ from "lodash-es";

export interface Configuration {
    logging: LoggingConfiguration
    downloads: DownloadConfiguration
    curseforge: CurseForgeModProviderConfiguration,
    ftb: FTBModProviderConfiguration
    confirmAll: boolean,
    configFile: string
}

export interface DownloadConfiguration {
    concurrency: number,
    outputDirectory: string
}

export type PartialConfiguration = DeepPartial<Configuration>;

export async function loadConfiguration(provider: ModProviderName, argv: string[]): Promise<Configuration> {
    let config: PartialConfiguration = _.defaultsDeep({}, ...[
        getArgumentConfiguration(provider, argv),
        getEnvironmentConfiguration()
    ]);

    config = _.defaultsDeep(config, ...[
        await getJsonConfiguration(config.configFile as string),
        getDefaultConfiguration()
    ]);

    if (provider == "modpacks.ch" || provider == "ftb") {
        const modpack: Partial<FTBModpackIdentifier> = config.ftb?.modpack ?? {};
        modpack.id ??= await inputNumber("Enter the modpack id: ");
        modpack.version ??= await inputNumber("Enter the modpack version: ");

        config.ftb.modpack = modpack as FTBModpackIdentifier;
    }

    return config as Configuration;
}

export function registerConfiguration(container: Container, config: Configuration): void {
    container.bind(ABSTRACTIONS.Configuration.Downloads).toConstantValue(config.downloads);
    container.bind(ABSTRACTIONS.Configuration.Logging).toConstantValue(config.logging);
    container.bind(ABSTRACTIONS.Configuration.Providers.CurseForge).toConstantValue(config.curseforge);
    container.bind(ABSTRACTIONS.Configuration.Providers.FTB).toConstantValue(config.ftb);
    container.bind(ABSTRACTIONS.Configuration.All).toConstantValue(config);
}
