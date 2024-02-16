import { PathLike } from "fs";
import { FileHandle, readFile, readdir } from "fs/promises";
import input from "@inquirer/input";

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

export type Nullable<T> = T | null

export async function resolvePipeline<T>(resolvers: (() => Promise<Nullable<T>>)[]): Promise<Nullable<T>> {
    for (const resolver of resolvers) {
        const result = await resolver();
        if (result) return result;
    }

    return null;
}