import client from "prom-client";

const GLOBAL_KEY = "__booking_app_prom_metrics__" as const;

type PromBundle = {
  register: client.Registry;
  requestCounter: client.Counter<"method" | "route">;
};

function getMetrics(): PromBundle {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: PromBundle };
  if (g[GLOBAL_KEY]) {
    return g[GLOBAL_KEY];
  }

  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  const requestCounter = new client.Counter({
    name: "nextjs_requests_total",
    help: "Total requests",
    labelNames: ["method", "route"],
  });

  register.registerMetric(requestCounter);

  g[GLOBAL_KEY] = { register, requestCounter };
  return g[GLOBAL_KEY];
}

export function getRegister(): client.Registry {
  return getMetrics().register;
}

export function recordRequest(method: string, route: string): void {
  getMetrics().requestCounter.inc({ method, route });
}
