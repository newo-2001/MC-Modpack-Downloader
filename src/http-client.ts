import fetch, { HeadersInit } from "node-fetch";
import { Readable } from "stream";

export class HttpClient {
    public constructor(private readonly baseUrl: string,
                       private readonly headers: HeadersInit = {}) { }
    
    public static async get<T>(url: string, headers: HeadersInit = {}): Promise<T> {
        return (await fetch(url, { headers })).json() as T;
    }

    public get<T>(endpoint: string): Promise<T> {
        const url = this.baseUrl + endpoint;
        return HttpClient.get(url, this.headers);
    }

    public static async download(url: string, headers: HeadersInit = {}): Promise<Readable> {
        const result = await fetch(url, { headers });
        const blob = await result.blob();
        return Readable.fromWeb(blob.stream());
    }
}