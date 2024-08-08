import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
  transports: [new transports.Console()],
});

export default logger;
