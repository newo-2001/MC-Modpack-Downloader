import { readJsonFile } from "./utils.js";

export interface Settings {
    output_directory: string,
    curseforge_api_key: string,
    modpack: {
        id: number,
        version: number
    }
}

export async function readSettings(): Promise<Settings> {
    try {
        return await readJsonFile("settings.json") as Settings;
    } catch {
        throw new Error("Failed to load settings.json, please copy settings.example.json and enter the appropriate information.");
    }
}