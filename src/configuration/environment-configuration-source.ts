import { PartialConfiguration } from "./configuration.js";

export function getEnvironmentConfiguration(): PartialConfiguration {
    const {
        MCDL_CURSEFORGE_API_KEY: curseforgeApiKey
    } = process.env;

    return {
        curseforge: {
            apiKey: curseforgeApiKey
        }
    }
}
