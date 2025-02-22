import { parse, ArgumentConfig } from "ts-command-line-args";
import { PartialConfiguration } from "./configuration.js";
import { ModProviderName } from "../mod-providers/mod-provider.js";
import { LogLevel, logLevels } from "../logging.js";
import * as _ from "lodash-es";

interface Arguments {
    "modpack-id"?: number,
    "modpack-version"?: number,
    "manifest-file"?: string,
    "concurrency"?: number,
    "output-directory"?: string,
    "log-file": string,
    "log-level": LogLevel,
    "yes"?: boolean,
    "help"?: boolean,
    "config-file"?: string
}

function int(value?: string): number | undefined {
    if (!value) return undefined;

    const number = parseInt(value, 10);
    return typeof(number) == "number" && !isNaN(number) ? number : undefined;
}

function logLevel(value?: string): LogLevel | undefined {
    return logLevels.find((level) => level == value)
}

function trimArguments(argv: string[]): string[] {
    if (argv.length < 2) return [];

    argv = argv.slice(2);
    while (argv[0] && !argv[0].startsWith('-')) {
        argv = argv.slice(1);
    }

    return argv;
}

export function getArgumentConfiguration(provider: ModProviderName, argv: string[]): PartialConfiguration {
    let argumentConfig: Partial<ArgumentConfig<Arguments>> = {
        help: { type: Boolean, optional: true, alias: 'h', description: "Prints this usage guide" },
        yes: { type: Boolean, optional: true, alias: 'y', description: "Automatically answer all confirmation prompts with 'yes'" },
        concurrency: { type: int, optional: true, description: "The amount of downloads that will happen at the same time" },
        "output-directory": { type: String, optional: true, alias: 'o', description: "The folder to put the downloaded files into" },
        "log-file": { type: String, optional: true, description: "The file to log to" },
        "log-level": { type: logLevel, optional: true, description: "The lowest level of importance to log. Valid values are: debug, info, warn, and error" },
        "config-file": { type: String, optional: true, alias: 'c', description: "The settings.json file path" }
    };

    if (provider == "modpacks.ch" || provider == "ftb") {
        _.defaults(argumentConfig, {
            "modpack-id": { type: int, optional: true, description: "The modpack id of the FTB modpack to download" },
            "modpack-version": { type: int, optional: true, description: "The modpack version of the FTB modpack to download" }
        })
    }

    if (provider == "curseforge") {
        _.defaults(argumentConfig, {
            "manifest-file": { type: String, optional: true, description: "The location of the manifest.json file" },
        })
    }

    const args = parse<Arguments>(
        argumentConfig as ArgumentConfig<Arguments>,
        {
            argv: trimArguments(argv),
            processExitCode: 1,
            helpArg: "help"
        }
    );

    const bindings: { [Key in keyof Arguments]: PartialConfiguration } = {
        "modpack-id": { ftb: { modpack: { id: args["modpack-id"] } } },
        "modpack-version": { ftb: { modpack: { version: args["modpack-version"] } } },
        "manifest-file": { curseforge: { manifestFile: args["manifest-file"] } },
        "yes": { confirmAll: args["yes"] },
        "concurrency": { downloads: { concurrency: args["concurrency"] } },
        "output-directory": { downloads: { outputDirectory: args["output-directory"] } },
        "log-file": { logging: { logFile: args["log-file"] } },
        "log-level": { logging: { logLevel: args["log-level"] } },
        "config-file": { configFile: args["config-file"] }
    };

    let config: PartialConfiguration = {};
    for (const [name, binding] of Object.entries(bindings)) {
        if (args[name] != undefined) {
            _.defaultsDeep(config, binding);
        }
    }

    return config
}
