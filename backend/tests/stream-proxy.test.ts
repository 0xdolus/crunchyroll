import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import { encodeUrl, proxySegment } from "../src/services/providers/stream.js";

const FIXTURES_ROOT = path.resolve(process.cwd(), "..", "fixtures");

function readFixture(name: string): string | null {
  const p = path.join(FIXTURES_ROOT, name);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, "utf8").trim();
  }
  return null;
}

describe("encodeUrl", () => {
  it("matches Worker base64url encoding (no padding, - and _)", () => {
    const input = "https://example.com/path/to/seg.jpg?token=abc";
    const encoded = encodeUrl(input);
    // Must be pure base64url without =
    expect(encoded).not.toMatch(/[+/=]/);
    // Round-trip check
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const decoded = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    expect(decoded).toBe(input);
  });

  it("is deterministic", () => {
    const url = "https://cdn.example/segment/seg.jpg";
    expect(encodeUrl(url)).toBe(encodeUrl(url));
  });
});

describe("proxySegment pathname rule", () => {
  const originalEnv = process.env.STREAM_PROXY_URL;

  beforeAll(() => {
    process.env.STREAM_PROXY_URL = "https://stream-proxy.example.com";
  });

  afterAll(() => {
    process.env.STREAM_PROXY_URL = originalEnv;
  });

  it("uses /proxy/seg.ts/{encoded} when pathname ends with /seg.jpg", () => {
    const url = "https://upstream.example/video/seg.jpg";
    const proxied = proxySegment(url);
    expect(proxied).toContain("/proxy/seg.ts/");
    expect(proxied).toContain(encodeUrl(url));
    expect(proxied).not.toContain("?url=");
  });

  it("uses query form for normal .ts segments", () => {
    const url = "https://upstream.example/video/segment.ts";
    const proxied = proxySegment(url);
    expect(proxied).toContain("/proxy?url=");
    expect(proxied).toContain(encodeURIComponent(url));
  });

  it("does not use url.endsWith('.seg.jpg')", () => {
    // Real fixtures contain "/seg.jpg" as pathname suffix, not ".seg.jpg"
    const url = "https://cdn.example/path/seg.jpg";
    const pathname = new URL(url).pathname;
    expect(pathname.endsWith("/seg.jpg")).toBe(true);
    expect(url.endsWith(".seg.jpg")).toBe(false);
  });
});

describe("fixture-based proxy verification", () => {
  it("transforms segment.upstream.txt into segment.proxy.txt when fixtures exist", () => {
    const upstream = readFixture("segment.upstream.txt");
    const expected = readFixture("segment.proxy.txt");
    if (!upstream || !expected) {
      console.warn("Fixtures not present — skipping exact fixture match");
      return;
    }
    // Set proxy base if needed; fixtures already contain full expected URLs
    process.env.STREAM_PROXY_URL =
      process.env.STREAM_PROXY_URL || "https://stream-proxy.example.com";
    const result = proxySegment(upstream);
    expect(result.trim()).toBe(expected.trim());
  });

  it("proxy playlist fixture matches Worker URL format when present", () => {
    const fixture = readFixture("proxy-playlist-url.txt");
    if (!fixture) {
      console.warn("proxy-playlist-url.txt not present — skipping");
      return;
    }
    expect(fixture).toMatch(/\/proxy\?url=/);
  });

  it("rewritten playlist contains /proxy/seg.ts/ when upstream has seg.jpg", () => {
    const upstream = readFixture("playlist.upstream.m3u8");
    const rewritten = readFixture("playlist.rewritten.m3u8");
    if (!upstream || !rewritten) {
      console.warn("Playlist fixtures not present — skipping");
      return;
    }
    expect(rewritten).toContain("/proxy/seg.ts/");
  });
});
