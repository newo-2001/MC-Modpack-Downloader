import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "../../abstractions/abstractions.js";
import { ModpacksChModProviderSettings, ModpacksChModpackIdentifier } from "./modpacks.ch-types.js";
import { Nullable, resolvePipeline } from "../../utils.js";
import { inputNumber } from "../../interactive.js";

@injectable()
export class ModpacksChModpackIdResolver {
    constructor(
        @inject(ABSTRACTIONS.Settings.Providers.ModpacksCh) private readonly modpacksChSettings : ModpacksChModProviderSettings
    ) { }

    public async resolve(): Promise<Nullable<ModpacksChModpackIdentifier>> {
        return resolvePipeline([
            () => Promise.resolve(this.modpacksChSettings.modpack),
            inquireModpackId,
        ])
    }
}

async function inquireModpackId(): Promise<ModpacksChModpackIdentifier> {
    const id = await inputNumber("Enter the modpack id: ");
    const version = await inputNumber("Enter the modpack version: ");

    return { id, version }
}