import { Container } from "inversify";
import { ABSTRACTIONS } from "../abstractions.js";
import { CurseForgeModProviderConfiguration } from "../mod-providers/curseforge/curseforge-types.js";
import { ModpacksChModProviderConfiguration, ModpacksChModpackIdentifier } from "../mod-providers/modpacks.ch/modpacks.ch-types.js";
import * as _ from "lodash-es";
import { getJsonConfiguration } from "./json-configuration-source.js";
import { getDefaultConfiguration } from "./default-configuration-source.js";
import { getArgumentConfiguration } from "./arguments-configuration-source.js";
import { ModProviderName } from "../mod-providers/mod-provider.js";
import { inputNumber } from "../interactive.js";
import { DeepPartial } from "../utils.js";

export interface Configuration {
    logging: LoggingConfiguration
    downloads: DownloadConfiguration
    curseforge: CurseForgeModProviderConfiguration,
    "modpacks.ch": ModpacksChModProviderConfiguration
}

export interface DownloadConfiguration {
    concurrency: number,
    outputDirectory: string
}

export interface LoggingConfiguration {
    logLevel: string,
    logFile: string
}

export type PartialConfiguration = DeepPartial<Configuration>;

export async function loadConfiguration(provider: ModProviderName): Promise<Configuration> {
    let config: PartialConfiguration = _.defaultsDeep({}, ...await Promise.all([
        getArgumentConfiguration(provider),
        getJsonConfiguration(),
        getDefaultConfiguration()
    ]));

    if (provider == "modpacks.ch") {
        const modpack: Partial<ModpacksChModpackIdentifier> = config["modpacks.ch"]?.modpack ?? {};
        modpack.id ??= await inputNumber("Enter the modpack id: ");
        modpack.version ??= await inputNumber("Enter the modpack version: ");

        config["modpacks.ch"].modpack = modpack as ModpacksChModpackIdentifier;
    }

    return config as Configuration;
}

export function registerConfiguration(container: Container, config: Configuration): void {
    container.bind(ABSTRACTIONS.Configuration.Downloads).toConstantValue(config.downloads);
    container.bind(ABSTRACTIONS.Configuration.Logging).toConstantValue(config.logging);
    container.bind(ABSTRACTIONS.Configuration.Providers.CurseForge).toConstantValue(config.curseforge);
    container.bind(ABSTRACTIONS.Configuration.Providers.ModpacksCh).toConstantValue(config["modpacks.ch"]);
    container.bind(ABSTRACTIONS.Configuration.All).toConstantValue(config);
}
