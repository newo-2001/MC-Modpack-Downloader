export const ABSTRACTIONS = {
    Configuration: {
        Providers: {
            CurseForge: Symbol("Configuration.CurseForge"),
            ModpacksCh: Symbol("Configuration.ModpacksCh"),
            FTB: Symbol("Configuration.FTB")
        },
        Downloads: Symbol("Configuration.Downloads"),
        Logging: Symbol("Configuration.Logging"),
        All: Symbol("Configuration.All")
    },
    Services: {
        ModProvider: Symbol("Services.ModProvider"),
        CurseForgeModProvider: Symbol("Services.CurseForgeModProvider"),
        ModpackIdResolver: Symbol("Services.ModpackIdResolver")
    },
    HttpClients: {
        CurseForge: Symbol("HttpClients.CurseForge"),
        FTB: Symbol("HttpClients.FTB")
    }
};
