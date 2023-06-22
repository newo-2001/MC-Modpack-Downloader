import { PathLike } from "fs";
import { FileHandle, readFile } from "fs/promises";

export async function readJsonFile<T>(path: PathLike | FileHandle): Promise<T> {
    try {
        const content = (await readFile(path)).toString("utf-8");
        return JSON.parse(content) as T;
    } catch {
        throw new Error(`Failed to read JSON file: ${path}`);
    }
}