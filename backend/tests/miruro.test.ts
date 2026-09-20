import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  parseMiruroEpisodesResponse,
  selectCanonicalEpisodes,
} from "../src/services/providers/miruroEpisodes.js";
import {
  miruroWatchPath,
  resolveMiruroWatchId,
  resolveMiruroWithFallback,
} from "../src/services/providers/miruro.js";
import { AppError } from "../src/middleware/errors.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleMiruroEpisodes = {
  success: true,
  results: {
    providers: {
      zoro: {
        episodes: {
          sub: [
            {
              id: "watch/zoro/20/sub/zoro-2",
              number: 2,
              title: "Zoro Ep 2",
              image: "https://img/z2",
            },
          ],
          dub: [],
        },
      },
      kiwi: {
        episodes: {
          sub: [
            {
              id: "watch/kiwi/20/sub/anikoto-1",
              number: 1,
              title: "Enter: Naruto Uzumaki!",
              image: "https://img/1",
              airDate: "2002-10-03",
              description: "Naruto arrives",
              filler: false,
              fillerType: "manga_canon",
            },
            {
              id: "watch/kiwi/20/sub/anikoto-2",
              number: 2,
              title: "My Name is Konohamaru!",
              image: "https://img/2",
            },
          ],
          dub: [
            {
              id: "watch/kiwi/20/dub/anikoto-1",
              number: 1,
              title: "Enter: Naruto Uzumaki! (Dub)",
              image: "https://img/1d",
            },
          ],
        },
      },
      arc: {
        episodes: {
          sub: [
            {
              id: "watch/arc/20/sub/arc-1",
              number: 1,
              title: "Arc Ep 1",
            },
          ],
          dub: [],
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Episode parsing
// ---------------------------------------------------------------------------

describe("parseMiruroEpisodesResponse", () => {
  it("extracts sub and dub from multiple providers", () => {
    const parsed = parseMiruroEpisodesResponse(sampleMiruroEpisodes);
    expect(parsed.length).toBeGreaterThanOrEqual(4);

    const subs = parsed.filter((e) => e.audio === "sub");
    const dubs = parsed.filter((e) => e.audio === "dub");
    expect(subs.length).toBeGreaterThan(0);
    expect(dubs.length).toBe(1);
  });

  it("preserves Miruro watch IDs", () => {
    const parsed = parseMiruroEpisodesResponse(sampleMiruroEpisodes);
    const kiwi1 = parsed.find(
      (e) => e.watchId === "watch/kiwi/20/sub/anikoto-1"
    );
    expect(kiwi1).toBeDefined();
    expect(kiwi1!.number).toBe(1);
    expect(kiwi1!.provider).toBe("kiwi");
    expect(kiwi1!.audio).toBe("sub");
    expect(kiwi1!.title).toBe("Enter: Naruto Uzumaki!");
  });

  it("orders providers deterministically (kiwi before zoro)", () => {
    const parsed = parseMiruroEpisodesResponse(sampleMiruroEpisodes);
    const ep1Providers = parsed
      .filter((e) => e.number === 1 && e.audio === "sub")
      .map((e) => e.provider);
    // kiwi should appear before arc before any unknown, and zoro is only ep2
    expect(ep1Providers.indexOf("kiwi")).toBeLessThan(
      ep1Providers.indexOf("arc")
    );
  });

  it("throws on malformed payload", () => {
    expect(() => parseMiruroEpisodesResponse(null)).toThrow(AppError);
    expect(() => parseMiruroEpisodesResponse("nope")).toThrow(AppError);
  });

  it("returns empty list when providers missing (legitimate zero episodes)", () => {
    const parsed = parseMiruroEpisodesResponse({
      success: true,
      results: { providers: {} },
    });
    expect(parsed).toEqual([]);
  });
});

describe("selectCanonicalEpisodes", () => {
  it("picks one episode per number preferring sub over dub", () => {
    const parsed = parseMiruroEpisodesResponse(sampleMiruroEpisodes);
    const canonical = selectCanonicalEpisodes(parsed);

    const numbers = canonical.map((e) => e.number);
    expect(new Set(numbers).size).toBe(numbers.length);

    const ep1 = canonical.find((e) => e.number === 1);
    expect(ep1).toBeDefined();
    expect(ep1!.audio).toBe("sub");
    // kiwi ranks above arc
    expect(ep1!.provider).toBe("kiwi");
    expect(ep1!.watchId).toBe("watch/kiwi/20/sub/anikoto-1");
  });

  it("maps cleanly to Supabase upsert fields", () => {
    const parsed = parseMiruroEpisodesResponse(sampleMiruroEpisodes);
    const canonical = selectCanonicalEpisodes(parsed);
    const ep = canonical[0];

    // Shape expected by upsertEpisode
    const row = {
      anime_id: "uuid-anime",
      episode_number: ep.number,
      title: ep.title ?? null,
      description: ep.description ?? null,
      thumbnail_url: ep.image ?? null,
      air_date: ep.airDate ?? null,
      provider: "miruro" as const,
      provider_episode_id: ep.watchId,
    };

    expect(row.provider).toBe("miruro");
    expect(row.provider_episode_id).toMatch(/^watch\//);
    expect(row.episode_number).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Watch ID → stream resolution
// ---------------------------------------------------------------------------

describe("miruroWatchPath", () => {
  it("accepts full watch/... ids", () => {
    expect(miruroWatchPath("watch/kiwi/20/sub/anikoto-1")).toBe(
      "watch/kiwi/20/sub/anikoto-1"
    );
  });

  it("strips leading slash", () => {
    expect(miruroWatchPath("/watch/kiwi/20/sub/anikoto-1")).toBe(
      "watch/kiwi/20/sub/anikoto-1"
    );
  });

  it("rejects empty", () => {
    expect(() => miruroWatchPath("")).toThrow(AppError);
  });
});

describe("resolveMiruroWatchId", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.MIRURO_ENDPOINT = "https://miruro.test/api";
    process.env.STREAM_PROXY_URL =
      "https://crunchyroll-stream-test.sniffingbug.workers.dev";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("selects HLS stream and proxies playlist URL", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          results: {
            streams: [
              { url: "https://cdn.example/master.m3u8", quality: "1080p", type: "hls" },
              { url: "https://cdn.example/video.mp4", quality: "720p" },
            ],
            subtitles: [{ file: "https://cdn.example/en.vtt", label: "English" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as typeof fetch;

    const resolved = await resolveMiruroWatchId("watch/kiwi/20/sub/anikoto-1");

    expect(resolved.playlistUrl).toBe("https://cdn.example/master.m3u8");
    expect(resolved.proxyPlaylistUrl).toContain("/proxy?url=");
    expect(resolved.proxyPlaylistUrl).toContain(
      encodeURIComponent("https://cdn.example/master.m3u8")
    );
    expect(resolved.quality).toBe("1080p");
    expect(resolved.subtitles).toEqual([
      { language: "English", url: "https://cdn.example/en.vtt" },
    ]);
    expect(resolved.sources.length).toBe(2);
  });

  it("throws ProviderUnavailable when no HLS source", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          results: {
            streams: [{ url: "https://cdn.example/embed.html", type: "embed" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as typeof fetch;

    await expect(
      resolveMiruroWatchId("watch/kiwi/20/sub/anikoto-1")
    ).rejects.toMatchObject({
      statusCode: 503,
      error: "ProviderUnavailable",
    });
  });

  it("throws ProviderUnavailable on upstream 5xx", async () => {
    globalThis.fetch = (async () =>
      new Response("nope", { status: 502 })) as typeof fetch;

    await expect(
      resolveMiruroWatchId("watch/kiwi/20/sub/anikoto-1")
    ).rejects.toMatchObject({
      statusCode: 503,
      error: "ProviderUnavailable",
    });
  });
});

describe("resolveMiruroWithFallback", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("tries next watch ID when primary fails", async () => {
    let calls = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls += 1;
      const url = String(input);
      if (url.includes("watch/fail")) {
        return new Response("gone", { status: 404 });
      }
      return new Response(
        JSON.stringify({
          results: {
            streams: [
              { url: "https://cdn.example/ok.m3u8", quality: "auto", type: "hls" },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const resolved = await resolveMiruroWithFallback("watch/fail/1", [
      "watch/kiwi/20/sub/anikoto-1",
    ]);

    expect(calls).toBe(2);
    expect(resolved.playlistUrl).toContain("ok.m3u8");
  });

  it("returns ProviderUnavailable when all providers fail", async () => {
    globalThis.fetch = (async () =>
      new Response("down", { status: 503 })) as typeof fetch;

    await expect(
      resolveMiruroWithFallback("watch/a", ["watch/b"])
    ).rejects.toMatchObject({
      statusCode: 503,
      error: "ProviderUnavailable",
    });
  });
});
