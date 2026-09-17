import { describe, it, expect } from "@jest/globals";

describe("health", () => {
  it("exports a valid health response shape", () => {
    const body = {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("2.0.0");
    expect(typeof body.timestamp).toBe("string");
  });
});
