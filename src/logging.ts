import { Logger, format, transports } from "winston";
import winston from "winston";
import { Container } from "inversify";
import { ABSTRACTIONS } from "./abstractions.js";
import { createWriteStream } from "fs";

function createLogger(config: LoggingConfiguration): Logger {
    return winston.createLogger({
        transports: [
            new transports.Stream({
                stream: createWriteStream(config.logFile),
                level: config.logLevel,
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
    const logger = createLogger(container.get(ABSTRACTIONS.Configuration.Logging));
    container.bind(Logger).toConstantValue(logger);
}

export const logLevels = ["debug", "info", "warn", "error"] as const;
export type LogLevel = typeof logLevels[number];

export interface LoggingConfiguration {
    logLevel: LogLevel,
    logFile: string
}
