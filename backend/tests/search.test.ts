import { describe, it, expect } from "@jest/globals";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

describe("search query validation", () => {
  it("accepts valid query", () => {
    const result = querySchema.safeParse({ q: "naruto", page: "1", perPage: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("naruto");
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(10);
    }
  });

  it("rejects empty query", () => {
    const result = querySchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });
});
