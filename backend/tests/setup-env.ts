process.env.NODE_ENV = "test";

process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY ||= "sb_publishable_test";
process.env.SUPABASE_SECRET_KEY ||= "sb_secret_test";

process.env.TMDB_ACCESS_TOKEN ||= "tmdb_test_token";

process.env.STREAM_PROXY_URL ||= "https://stream.example.workers.dev";
process.env.SYNC_SECRET ||= "sync_test_secret";

process.env.PORT ||= "3000";
process.env.ALLOWED_ORIGINS ||= "http://localhost:3000";
