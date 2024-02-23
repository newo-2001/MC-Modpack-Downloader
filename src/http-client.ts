import fetch, { HeadersInit } from "node-fetch";
import { Readable } from "stream";
import { Logger } from "winston";
import { HttpException } from "./exceptions.js";

export class HttpClient {
    public constructor(private readonly baseUrl: string,
                       private readonly headers: HeadersInit,
                       private readonly logger: Logger) { }

    public async get<T>(endpoint: string): Promise<T> {
        const url = this.baseUrl + endpoint;
        this.logger.debug(`HTTP GET ${url}`);

        const response = await fetch(url, { headers: this.headers })
        if (response.status < 200 || response.status >= 300) {
            throw new HttpException(url, response.status);
        }

        const responseText = await response.text();

        try {
            return await JSON.parse(responseText) as T;
        } catch (err) {
            throw new Error(`Error during json response parsing: ${err}. For response: "${responseText}"`);
        }
    }

    public async download(url: string): Promise<Readable> {
        this.logger.debug(`HTTP GET (blob) ${url}`);
        const response = await fetch(url, { headers: this.headers });

        if (response.status < 200 || response.status >= 300) {
            throw new HttpException(url, response.status);
        }

        const blob = await response.blob();
        return Readable.fromWeb(blob.stream());
    }
}
