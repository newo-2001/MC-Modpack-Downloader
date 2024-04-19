import { parse, ArgumentConfig } from "ts-command-line-args";
import { PartialConfiguration } from "./configuration.js";
import { ModProviderName } from "../mod-providers/mod-provider.js";
import { LogLevel, logLevels } from "../logging.js";
import * as _ from "lodash-es";

interface Arguments {
    "modpack-id"?: number,
    "modpack-version"?: number,
    "concurrency"?: number,
    "output-directory"?: string,
    "log-file": string,
    "log-level": LogLevel,
    "yes"?: boolean,
    "help"?: boolean
}

function int(value?: string): number | undefined {
    if (!value) return undefined;

    const number = parseInt(value, 10);
    return typeof(number) == "number" && !isNaN(number) ? number : undefined;
}

function logLevel(value?: string): LogLevel | undefined {
    return logLevels.find((level) => level == value)
}

function getArguments(): string[] {
    if (process.argv.length < 2) return [];

    let argv = process.argv.slice(2);
    while (argv[0] && !argv[0].startsWith('-')) {
        argv = argv.slice(1);
    }

    return argv;
}

export function getArgumentConfiguration(provider: ModProviderName): PartialConfiguration {
    let argumentConfig: Partial<ArgumentConfig<Arguments>> = {
        help: { type: Boolean, optional: true, alias: 'h', description: "Prints this usage guide" },
        yes: { type: Boolean, optional: true, alias: 'y', description: "Automatically answer all confirmation prompts with 'yes'" },
        concurrency: { type: int, optional: true, description: "The amount of downloads that will happen at the same time" },
        "output-directory": { type: String, optional: true, alias: 'o', description: "The folder to put the downloaded files into" },
        "log-file": { type: String, optional: true, description: "The file to log to" },
        "log-level": { type: logLevel, optional: true, description: "The lowest level of importance to log. Valid values are: debug, info, warn, and error" }
    };

    if (provider == "modpacks.ch") {
        _.defaults(argumentConfig, {
            "modpack-id": { type: int, optional: true, description: "The modpack id of the modpacks.ch modpack to download" },
            "modpack-version": { type: int, optional: true, description: "The modpack version of the modpacks.ch modpack to download" }
        })
    }

    const args = parse<Arguments>(
        argumentConfig as ArgumentConfig<Arguments>,
        {
            argv: getArguments(),
            processExitCode: 1,
            helpArg: "help"
        }
    );

    const bindings: { [Key in keyof Arguments]: PartialConfiguration } = {
        "modpack-id": { "modpacks.ch": { modpack: { id: args["modpack-id"] } } },
        "modpack-version": { "modpacks.ch": { modpack: { version: args["modpack-version"] } } },
        "yes": { confirmAll: args["yes"] },
        "concurrency": { downloads: { concurrency: args["concurrency"] } },
        "output-directory": { downloads: { outputDirectory: args["output-directory"] } },
        "log-file": { logging: { logFile: args["log-file"] } },
        "log-level": { logging: { logLevel: args["log-level"] } }
    };

    let config: PartialConfiguration = {};
    for (const [name, binding] of Object.entries(bindings)) {
        if (args[name] != undefined) {
            _.defaultsDeep(config, binding);
        }
    }

    return config
}
