import "reflect-metadata";
import { vol } from "memfs";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { run } from "../../src/app";
import { ModpacksChModManifest, ModpacksChModpackIdentifier, ModpacksChModpackManifest, ModpacksChModpackVersionManifest } from "../../src/mod-providers/modpacks.ch/modpacks.ch-types";
import { DeepPartial } from "../../src/utils";
import { Configuration } from "../../src/configuration/configuration";
import winston from "winston";

vi.mock("node:fs", () => require("memfs").fs);
vi.mock("node:fs/promises", () => require("memfs").promises);

// Ideally this assertion is done on stdout directly, instead of winston
const consoleSpy = vi.spyOn(winston.transports.Console.prototype, "log");

beforeEach(() => {
    vol.reset();
    consoleSpy.mockClear();
});

describe("modpacks.ch command", () => {
    test("downloads the mods for a given modpack id from the modpacks.ch API", async () => {
        const modpackId: ModpacksChModpackIdentifier = { id: 1, version: 1 };

        const modpacksChBaseUrl = "https://api.modpacks.ch/public";

        const settings: DeepPartial<Configuration> = { curseforge: { apiKey: "abcdefg" } };

        vol.fromJSON({ "settings.json": JSON.stringify(settings) }, process.cwd());

        const modpacksChFileEndpoints: { [name: string]: ModpacksChModManifest & { content?: string } } = {
            mod1: {
                path: "./mods/",
                name: "mod1.jar",
                url: "https://dist.modpacks.ch/testuser/mod1/1.0.0/mod1.jar",
                content: "test"
            },
            mod2: {
                path: "./mods/",
                name: "mod2.jar",
                curseforge: {
                    project: 1,
                    file: 1,
                }
            },
            mod3: {
                path: "./mods/",
                name: "mod3.jar",
                curseforge: {
                    project: 2,
                    file: 2
                }
            },
            options: {
                path: "./config/",
                name: "options.txt",
                url: "https://dist.modpacks.ch/modpacks/1/testpack/1.0.0/options.txt",
                content: "{ version: 5 }"
            }
        };

        const curseForgeEndpoints: { endpoint: string, response: object }[] = [
            {
                endpoint: "/mods/1/files/1",
                response: {
                    fileName: "second.jar",
                    downloadUrl: "https://cdn.curseforge.com/files/abc.jar"
                }
            },
            {
                endpoint: "/mods/2/files/2",
                response: {
                    fileName: "third.jar",
                    downloadUrl: undefined,
                }
            },
            {
                endpoint: "/mods/2",
                response: {
                    links: {
                        websiteUrl: "https://curseforge.com/minecraft/mc-mods/test-mod"
                    }
                }
            }
        ];

        const server = setupServer(
            http.get(`${modpacksChBaseUrl}/modpack/${modpackId.id}`, () => {
                const manifest: ModpacksChModpackManifest = { name: "test pack" };
                return HttpResponse.json(manifest);
            }),
            http.get(`${modpacksChBaseUrl}/modpack/${modpackId.id}/${modpackId.version}`, () => {
                const versionManifest: ModpacksChModpackVersionManifest = { files: Object.values(modpacksChFileEndpoints) }
                return HttpResponse.json(versionManifest);
            }),
            ...[ modpacksChFileEndpoints.mod1, modpacksChFileEndpoints.options].map(file => {
                return http.get(file.url!, () => HttpResponse.text(file.content));
            }),
            ...curseForgeEndpoints.map(({ endpoint, response }) => {
                return http.get("https://api.curseforge.com/v1" + endpoint, req => {
                    if (req.request.headers.get("x-api-key") != settings.curseforge!.apiKey) {
                        return new HttpResponse("Invalid API key", { status: 403 });
                    } else {
                        return HttpResponse.json({ data: response });
                    }
                });
            }),
            http.get("https://cdn.curseforge.com/files/abc.jar", () => HttpResponse.text("test2")),
        );

        server.listen();

        await run(["node", "src/app.ts", "modpacks.ch", "--modpack-id", "1", "--modpack-version", "1"]);

        server.close();

        expect(vol.readFileSync("mods/mods/mod1.jar", "utf-8")).toBe("test");
        expect(vol.readFileSync("mods/mods/mod2.jar", "utf-8")).toBe("test2");
        expect(vol.readFileSync("mods/config/options.txt", "utf-8")).toBe(modpacksChFileEndpoints.options.content);

        expect(consoleSpy).toHaveBeenLastCalledWith(
            expect.objectContaining({
                message: expect.stringContaining("third.jar https://curseforge.com/minecraft/mc-mods/test-mod/files/2")
            }),
            expect.anything()
        );
    });
});