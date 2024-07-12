import "reflect-metadata";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { vol } from "memfs";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { run } from "../../src/app";
import { CurseForgeModMetadata, CurseForgeProjectMetadata } from "../../src/mod-providers/curseforge/curseforge-types";
import winston from "winston";
import { DeepPartial } from "../../src/utils";
import { Configuration } from "../../src/configuration/configuration";

vi.mock("node:fs", () => require("memfs").fs);
vi.mock("node:fs/promises", () => require("memfs").promises);

// Ideally this assertion is done on stdout directly, instead of winston
const consoleSpy = vi.spyOn(winston.transports.Console.prototype, "log");

beforeEach(() => {
    vol.reset();
    consoleSpy.mockClear();
});

describe("curseforge command", () => {
    test("downloads the mods specified in the manifest from the CurseForge API", async () => {
        const manifest = {
            name: "test pack",
            files: [1, 2, 3].map(i => ({ projectID: i, fileID: i }))
        };

        const settings: DeepPartial<Configuration> = {
            curseforge: { apiKey: "abcdefg" }
        };

        vol.fromJSON({
            "manifest.json": JSON.stringify(manifest),
            "settings.json": JSON.stringify(settings)
        }, process.cwd());

        const apiBaseUrl = "https://api.curseforge.com/v1";
        const cdnBaseUrl = "https://cdn.curseforge.com/files";
        
        const apiEndpoints: { endpoint: string, response: CurseForgeModMetadata | CurseForgeProjectMetadata }[] = [
            {
                endpoint: "/mods/1/files/1",
                response: { downloadUrl: `${cdnBaseUrl}/abc.jar`, fileName: "first.jar" }
            },
            {
                endpoint: "/mods/2/files/2",
                response: { downloadUrl: `${cdnBaseUrl}/def.jar`, fileName: "second.jar" }
            },
            {
                endpoint: "/mods/3/files/3",
                response: { downloadUrl: undefined, fileName: "third.jar" }
            },
            {
                endpoint: "/mods/3",
                response: {
                    links: { websiteUrl: "https://curseforge.com/minecraft/mc-mods/test-mod" }
                } as CurseForgeProjectMetadata
            }
        ];

        const server = setupServer(
            http.get(`${cdnBaseUrl}/abc.jar`, () => HttpResponse.text("test")),
            http.get(`${cdnBaseUrl}/def.jar`, () => HttpResponse.text("test2")),

            ...apiEndpoints.map(({ endpoint, response }) => http.get(apiBaseUrl + endpoint, req => {
                if (req.request.headers.get("x-api-key") != settings.curseforge!.apiKey) {
                    return new HttpResponse("Invalid API key", { status: 403 });
                }

                return HttpResponse.json({ data: response });
            }))
        );

        server.listen();

        await run(["node", "src/app.ts", "curseforge"]);

        server.close();

        expect(vol.readFileSync("mods/first.jar", "utf-8")).toBe("test");
        expect(vol.readFileSync("mods/second.jar", "utf-8")).toBe("test2");

        expect(consoleSpy).toHaveBeenLastCalledWith(
            expect.objectContaining({
                message: expect.stringContaining("third.jar https://curseforge.com/minecraft/mc-mods/test-mod/files/3")
            }),
            expect.anything()
        );
    });
});