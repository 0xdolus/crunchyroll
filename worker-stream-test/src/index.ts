import { proxy } from "./proxy";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", worker: "stream-test" });
    }

    if (url.pathname.startsWith("/proxy/")) {
      return proxy(request);
    }

    return new Response("Crunchyroll Stream Test Worker");
  }
};
