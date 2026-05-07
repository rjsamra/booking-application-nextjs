import pino from "pino";

/**
 * Structured server logs. Trace correlation: set DD_TRACE_LOGS_INJECTION=true when using dd-trace.
 * With Next on the host and Datadog Agent in Docker, stdout is Tier A; forward to the agent (Tier B) if you need log intake in Datadog locally.
 */
const isDev = process.env.NODE_ENV === "development";

export const logger = pino(
  isDev
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : { level: "info" },
);
