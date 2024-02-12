import { PathLike } from "fs";
import { FileHandle, readFile, readdir } from "fs/promises";
import { WriteStream } from "tty";

export async function readJsonFile<T>(path: PathLike | FileHandle): Promise<T> {
    try {
        const content = (await readFile(path)).toString("utf-8");
        return JSON.parse(content) as T;
    } catch {
        throw new Error(`Failed to read JSON file: ${path}`);
    }
}

export async function isDirectoryEmpty(path: PathLike): Promise<boolean> {
    try {
        const files = await readdir(path);
        return files.length == 0;
    } catch (err) {
        // Non-existing directory counts as empty
        return true;
    }
}