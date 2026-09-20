process.env.NODE_ENV = "test";

process.env.PORT ||= "3000";

process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY ||= "sb_publishable_test";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "sb_secret_test";

process.env.TMDB_ACCESS_TOKEN ||= "tmdb_test_token";

process.env.ANILIST_ENDPOINT ||= "https://graphql.anilist.co";
process.env.JIKAN_ENDPOINT ||= "https://api.jikan.moe/v4";

process.env.MIRURO_ENDPOINT ||= "https://miruro.test/api";

process.env.STREAM_PROXY_URL ||= "https://crunchyroll-stream-test.sniffingbug.workers.dev";

process.env.SYNC_SECRET ||= "sync_test_secret";

process.env.ALLOWED_ORIGINS ||= "http://localhost:3000";

process.env.CACHE_TTL_SEARCH ||= "600";
process.env.CACHE_TTL_ANIME ||= "21600";
process.env.CACHE_TTL_EPISODES ||= "3600";
process.env.CACHE_TTL_TRENDING ||= "1800";
