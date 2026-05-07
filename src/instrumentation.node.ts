import tracer from "dd-trace";

tracer.init({
  service: process.env.DD_SERVICE ?? "hotel-booking-local",
  env: process.env.DD_ENV ?? "local",
  logInjection: process.env.DD_TRACE_LOGS_INJECTION === "true",
});
