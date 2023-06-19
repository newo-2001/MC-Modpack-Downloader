import { dirname } from "path";
import { PathLike, existsSync, mkdir, createWriteStream, WriteStream } from "fs";
import { FileHandle, readFile } from "fs/promises";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { ReadableStream } from "stream/web";

export async function readJsonFile(path: PathLike | FileHandle): Promise<object> {
    try {
        const content = (await readFile(path)).toString("utf-8");
        return JSON.parse(content);
    } catch {
        throw new Error(`Failed to read JSON file: ${path}`);
    }
}

function makeWriteStream(location: string): Promise<WriteStream> {
    return new Promise((resolve, reject) => {
        mkdir(dirname(location), { recursive: true }, (err, _) => {
            if (err) return reject(err);
            resolve(createWriteStream(location));
        })
    })
}

export async function downloadToFile(url: string, location: string, options: RequestInit = {}): Promise<void> {
    if (existsSync(location)) return;

    // Ensure previous connections are closed by waiting for the event loop
    // As per: https://github.com/node-fetch/node-fetch/issues/1735
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const fileStream = await makeWriteStream(location);
    const stream = (await fetch(url, options)).body as ReadableStream;

    return finished(Readable.fromWeb(stream).pipe(fileStream));
}