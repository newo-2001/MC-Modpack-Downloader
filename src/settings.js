import { readFile } from "fs/promises";

export async function loadSettings() {
    try {
        return JSON.parse(await readFile("settings.json"));
    } catch {
        throw new Error("Failed to open settings.json, please copy settings.example.json and enter the appropriate information.");
    }
}