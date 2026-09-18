# Crunchyroll Stream Test Worker

Experimental Cloudflare Worker for proxying HLS playlists, AES keys and media segments.

## Endpoints

- /health
- /proxy/playlist?url=<m3u8>
- /proxy/segment?url=<segment>
- /proxy/key?url=<key>
