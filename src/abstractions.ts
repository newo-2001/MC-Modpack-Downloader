export const ABSTRACTIONS = {
    Configuration: {
        Providers: {
            CurseForge: Symbol("Configuration.CurseForge"),
            ModpacksCh: Symbol("Configuration.ModpacksCh")
        },
        Downloads: Symbol("Configuration.Downloads"),
        Logging: Symbol("Configuration.Logging"),
        All: Symbol("Configuration.All")
    },
    Services: {
        ModProvider: Symbol("Services.ModProvider"),
        CurseForgeModProvider: Symbol("Services.CurseForgeModProvider"),
        ModpackIdResolver: Symbol("Services.ModpackIdResolver")
    }
};
