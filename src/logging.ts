import { Logger, format, transports, level } from "winston";
import winston from "winston";
import { LoggingSettings } from "./settings.js";
import { Container } from "inversify";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";

function createLogger(settings: LoggingSettings): Logger {
    return winston.createLogger({
        transports: [
            new transports.File({
                filename: settings.logFile,
                level: settings.logLevel,
                options: { flags: 'w' },
                format: format.combine(
                    format.timestamp(),
                    format.printf(({ timestamp, level, message }) => {
                        return `${timestamp} [${level}] ${message}`;
                    })
                )
            }),
            new transports.Console({
                level: "info",
                format: format.combine(
                    format.colorize({
                        all: true,
                        colors: {
                            info: "bold blue"
                        }
                    }),
                    format.printf(({ message, level }) => `[${level}] ${message}`),
                ),
            })
        ]
    })
}

export function registerLogger(container: Container) {
    const logger = createLogger(container.get(ABSTRACTIONS.Settings.Logging));
    container.bind(Logger).toConstantValue(logger);
}