import { describe, expect, it } from "vitest";

import { jsonError, jsonOk } from "./api-json";

describe("jsonError", () => {
  it("returns JSON body with error shape and status", async () => {
    const res = jsonError(403, "FORBIDDEN", "Admin access required.");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Admin access required.",
      },
    });
  });
});

describe("jsonOk", () => {
  it("wraps payload in data with default 200", async () => {
    const res = jsonOk({ id: "b1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { id: "b1" } });
  });

  it("accepts custom status", async () => {
    const res = jsonOk({ created: true }, 201);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: { created: true } });
  });
});
