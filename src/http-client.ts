import fetch, { HeadersInit, Response } from "node-fetch";
import { Readable } from "stream";
import { Logger } from "winston";

export class HttpClient {
    public constructor(private readonly baseUrl: string,
                       private readonly headers: HeadersInit,
                       private readonly logger: Logger) { }

    public async get<T>(endpoint: string): Promise<T> {
        const url = this.baseUrl + endpoint;
        this.logger.debug(`HTTP GET ${url}`);

        const response = await (await fetch(url, { headers: this.headers })).text();

        try {
            return await JSON.parse(response) as T;
        } catch (err) {
            throw new Error(`Error during json response parsing: ${err}. For response: "${response}"`);
        }
    }

    public async download(url: string): Promise<Readable> {
        const result = await fetch(url, { headers: this.headers });
        const blob = await result.blob();
        this.logger.debug(`HTTP GET (blob) ${url}`);
        return Readable.fromWeb(blob.stream());
    }
}