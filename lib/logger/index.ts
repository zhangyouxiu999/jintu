import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

const logger = isProd
  ? pino({
      level: logLevel,
      base: {
        env: process.env.NODE_ENV,
      },
    })
  : pino({
      level: logLevel,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      },
      base: {
        env: process.env.NODE_ENV,
      },
    });

export default logger;
