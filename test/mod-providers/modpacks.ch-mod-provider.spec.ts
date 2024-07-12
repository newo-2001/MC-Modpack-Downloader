import "reflect-metadata";
import { describe, test, beforeEach, expect } from "vitest";
import { ModpacksChModProvider } from "../../src/mod-providers/modpacks.ch/modpacks.ch-mod-provider";
import { Mock } from "typemoq";
import { HttpClient } from "../../src/http-client";
import { Logger } from "winston";
import { ModProvider } from "../../src/mod-providers/mod-provider";
import { CurseForgeModIdentifier } from "../../src/mod-providers/curseforge/curseforge-types";
import { ModpacksChModManifest, ModpacksChModpackManifest, ModpacksChModpackVersionManifest } from "../../src/mod-providers/modpacks.ch/modpacks.ch-types";

const loggerMock = Mock.ofType<Logger>();
const httpClientMock = Mock.ofType<HttpClient>();
const curseForgeProviderMock = Mock.ofType<ModProvider<CurseForgeModIdentifier, string>>();
let sut: ModpacksChModProvider;

beforeEach(() => {
    httpClientMock.reset();
    curseForgeProviderMock.reset();
    sut = new ModpacksChModProvider(curseForgeProviderMock.object, httpClientMock.object, loggerMock.object);
});

describe("getManifest()", () => {
    const mod: ModpacksChModManifest = {
        path: "./mods/",
        name: "a.jar",
        url: "https://example.com/a.jar"
    };
    
    function setupValidModpack() {
        httpClientMock.setup(x =>
            x.get<ModpacksChModpackManifest>("/modpack/1")
        ).returns(() => Promise.resolve({
            status: "success",
            name: "Test pack"
        }));
    }

    function setupValidVersion() {
        httpClientMock.setup(x =>
            x.get<ModpacksChModpackVersionManifest>("/modpack/1/1")
        ).returns(() => Promise.resolve({
            status: "success",
            files: [ mod ]
        }));
    }

    test("called with a valid id obtains the modpack manifest from the modpacks.ch API", async () => {
        setupValidModpack();
        setupValidVersion();

        const result = await sut.getManifest({ id: 1, version: 1 });

        expect(result).toEqual({
            name: "Test pack",
            files: [ mod ]
        });
    });

    test("called with an invalid modpack id throws an error", async () => {
        setupValidVersion();
        
        httpClientMock.setup(
            x => x.get("/modpack/1")
        ).returns(() => Promise.resolve({
            status: "error",
            message: "Invalid modpack id"
        }));

        expect(sut.getManifest({ id: 1, version: 1 }))
            .rejects.toThrowError("Invalid modpack id");
    });

    test("called with an invalid version id throws an error", async () => {
        setupValidModpack();

        httpClientMock.setup(x =>
            x.get("/modpack/1/1")
        ).returns(() => Promise.resolve({
            status: "error",
            message: "Invalid version id"
        }));

        expect(sut.getManifest({ id: 1, version: 1 }))
            .rejects.toThrowError("Invalid version id");
    });
});

test("getName() return 'modpacks.ch'", () => {
    expect(sut.getName()).toBe("modpacks.ch");
});