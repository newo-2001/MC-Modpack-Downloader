import { PathLike, WriteStream, createWriteStream, mkdir } from "fs";
import { FileHandle, readFile } from "fs/promises";
import { dirname } from "path";

export async function readJsonFile<T>(path: PathLike | FileHandle): Promise<T> {
    try {
        const content = (await readFile(path)).toString("utf-8");
        return JSON.parse(content) as T;
    } catch {
        throw new Error(`Failed to read JSON file: ${path}`);
    }
}

export function openWritableFileStream(location: string): Promise<WriteStream> {
    return new Promise((resolve, reject) => {
        mkdir(dirname(location), { recursive: true }, (err, _) => {
            if (err) return reject(err);
            resolve(createWriteStream(location));
        })
    })
}