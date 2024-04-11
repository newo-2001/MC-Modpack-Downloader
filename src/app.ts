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
import { inputNumber, inquireModProvider, warnNonEmptyOutputDirectory } from "./interactive.js";
import { ModpacksChModpackIdentifier } from "./mod-providers/modpacks.ch/modpacks.ch-types.js";
import { FatalError } from "./exceptions.js";
import { run, subcommands, command, option, number, optional } from "cmd-ts";

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

// TODO: fix inquireModProvider
run(subcommands({
    name: "mod provider",
    cmds: {
        curseforge: command({
            name: "curseforge",
            args: {},
            handler: async () => {
                container.bind(ABSTRACTIONS.Services.ModProvider).to(CurseForgeModProvider).inTransientScope();
                await downloadModpack<string>("manifest.json");
            },
        }),
        "modpacks.ch": command({
            name: "modpacks.ch",
            args: {
                modpackId: option({
                    long: "modpack-id",
                    type: optional(number),
                    defaultValue: () => settings["modpacks.ch"].modpack?.id
                }),
                modpackVersion: option({
                    long: "modpack-version",
                    type: optional(number),
                    defaultValue: () => settings["modpacks.ch"].modpack?.version
                }),
            },
            handler: async ({ modpackId, modpackVersion }) => {
                modpackId ??= await inputNumber("Enter the modpack id: ");
                modpackVersion ??= await inputNumber("Enter the modpack version: ");

                container.bind(ABSTRACTIONS.Services.ModProvider).to(ModpacksChModProvider).inTransientScope();
                await downloadModpack<ModpacksChModpackIdentifier>({ id: modpackId, version: modpackVersion });
            }
        }),
        local: command({
            name: "local",
            args: {},
            handler: async ({}) => {
                container.bind(ABSTRACTIONS.Services.ModProvider).to(LocalModProvider).inTransientScope();
                await downloadModpack<string>("local");
            }
        })
    }
}), process.argv.slice(2));

async function downloadModpack<TPackId>(modpackId: TPackId): Promise<void> {
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
