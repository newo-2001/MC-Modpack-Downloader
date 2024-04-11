import { PartialConfiguration } from "./configuration.js"

export async function getDefaultConfiguration(): Promise<PartialConfiguration> {
    return Promise.resolve({
        logging: {
            logFile: "latest.log",
            logLevel: "debug"
        },
        downloads: {
            concurrency: 20,
            outputDirectory: "mods",
        },
        ["modpacks.ch"]: {}
    })
}
