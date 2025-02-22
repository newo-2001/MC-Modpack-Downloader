import { PartialConfiguration } from "./configuration.js"

export function getDefaultConfiguration(): PartialConfiguration {
    return {
        logging: {
            logFile: "latest.log",
            logLevel: "debug"
        },
        downloads: {
            concurrency: 20,
            outputDirectory: "mods",
        },
        ftb: {},
        curseforge: {
            manifestFile: "manifest.json"
        },
        confirmAll: false,
        configFile: "settings.json"
    };
}
