export async function proxy(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  const upstream = await fetch(target, {
    headers: {
      Referer: "https://kwik.cx/"
    }
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers
  });
}
